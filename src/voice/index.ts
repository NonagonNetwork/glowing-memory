import { VoiceConnection } from 'detritus-client/lib/media/voiceconnection';
import {
  ChannelGuildVoice,
  ChannelTextType,
} from 'detritus-client/lib/structures';
import * as prism from 'prism-media';
import { Stream, Writable } from 'stream';
import { readdirSync, unlinkSync, createWriteStream } from 'fs';
import dbg from 'debug';
import { spawn, ChildProcess } from 'child_process';
import { file } from 'tempy';
import { EventEmitter } from 'events';

import { Application } from '../Application';
import BaseEffect from './foundation/BaseEffect';
import BaseFormat from './foundation/BaseFormat';
import { EMBED_COLORS, FILENAME_REGEX } from '../constants';

const debug = dbg('Player');

class Player extends Writable {
  public ss = 0;
  private count = 0;
  private curPos = 0;
  private readonly FRAME_LENGTH = 20;
  private readonly voice: Voice;
  private timeouts: NodeJS.Timeout[] = [];

  constructor(voice: Voice) {
    super();
    this.voice = voice;
  }

  public get position(): number {
    return this.ss + this.curPos;
  }

  private calcMs(count: number) {
    const { startTime, restartTime, pauseTime } = this.voice;
    if (typeof startTime === 'boolean') return 0;
    return (
      this.FRAME_LENGTH +
      (count - 1) * this.FRAME_LENGTH -
      (Date.now() - (restartTime ? restartTime : startTime) - pauseTime)
    );
  }

  public write(chunk: any) {
    if (!this.voice.startTime) this.voice.startTime = Date.now();

    const ms = this.calcMs(this.count);
    this.timeouts.push(
      setTimeout(
        () => (
          this.voice.connection.sendAudio(chunk, { isOpus: true }),
          (this.curPos = ms)
        ),
        ms
      )
    );
    this.count++;

    return true;
  }

  public onEnd() {
    this.timeouts.push(setTimeout(() => this.kill(), this.calcMs(this.count)));
    debug('stream ends here');
  }

  public kill(notCritical = false) {
    for (const timeout of this.timeouts) clearTimeout(timeout);
    this.voice.connection.sendAudioSilenceFrame();

    this.count = 0;
    this.curPos = 0;

    if (!notCritical) {
      this.voice.playerKill();
      this.voice.startTime = false;
      this.voice.restartTime = null;
      this.ss = 0;
    }
    debug('Player.kill() call');
  }
}

export class Voice extends EventEmitter {
  public effects: Map<string, BaseEffect> = new Map();
  public connection: VoiceConnection;
  public queue: Stream[] = [];
  public startTime: number | boolean;
  public pauseTime = 0;
  public restartTime?: number;
  public readonly application: Application;
  public readonly channel: ChannelGuildVoice;
  public readonly logChannel: ChannelTextType;
  private formats: BaseFormat[] = [];
  private streams: Record<string, any> = {};
  private children: Record<string, any> = {};
  private player: Player;
  private currentlyPlaying;
  private tempPath: string;
  private readonly SAMPLE_RATE = 48000;
  private readonly AUDIO_CHANNELS = 2;
  private readonly FRAME_SIZE = 960;

  constructor(
    application: Application,
    channel: ChannelGuildVoice,
    logChannel: ChannelTextType
  ) {
    super();
    this.application = application;
    this.channel = channel;
    this.logChannel = logChannel;

    application.voices.set(channel.guildId, this);
    this.initialize();
  }

  private async initialize() {
    const { connection } = await this.channel.join();

    for (const formatFileName of readdirSync(__dirname + '/formats/')) {
      const Format: any = (
        await import(
          './formats/' + formatFileName.replace(FILENAME_REGEX, '')
        )
      ).default;
      this.formats.push(new Format());
    }

    for (const effectFileName of readdirSync(__dirname + '/effects/')) {
      const name = effectFileName.replace(FILENAME_REGEX, '');
      const Effect: any = (await import('./effects/' + name)).default;
      this.effects.set(name, new Effect());
    }

    this.connection = connection;
    this.connection.setOpusEncoder();
    this.connection.setSpeaking({ voice: true });
    this.emit('initComplete');
  }

  private convert2SOX(): Promise<string> {
    return new Promise((res, rej) => {
      const path = file();
      const ffmpeg = this.children.ffmpeg = spawn('ffmpeg', [
        '-i',
        '-',
        '-ar',
        this.SAMPLE_RATE.toString(),
        '-ac',
        this.AUDIO_CHANNELS.toString(),
        '-f',
        'sox',
        'pipe:1',
      ]);
      ffmpeg.on('close', (code: number) =>
        code === 0 ? (clearTimeout(timeout), res(path)) : rej()
      );

      const writeStream = createWriteStream(path);
      const timeout = setTimeout(() => (ffmpeg.kill(0), rej(new Error('Conversion timeout!'))), 10000);

      this.currentlyPlaying.pipe(ffmpeg.stdin);
      ffmpeg.stdout.pipe(writeStream);

      ffmpeg.on('error', (err) => rej(err));
      this.currentlyPlaying.on('error', (err: Error) => rej(err));
      writeStream.on('error', (err: Error) => rej(err));
    });
  }

  private onError(err: Error) {
    debug('error on one of the streams:', err);
    this.logChannel.createMessage({
      embed: {
        title: 'Error occurred, skipping to the next track.',
        description: '```\n' + err.message + '```',
        color: EMBED_COLORS.ERR
      }
    });
    if (this.player)
      this.player.kill()
    else this.playerKill();
  }

  private async start(ss?: number) {
    const restarted = typeof ss !== 'undefined';
    this.killPrevious(restarted);

    if (!restarted && this.player) {
      this.player.ss = 0;
    }

    if (!this.tempPath) {
      debug('converting to SOX');
      try {
        this.tempPath = await this.convert2SOX();
      } catch (err) {
        this.onError(err);
        return debug('ERR: converting to SOX failed, reason:', err);
      }
      debug('done, filename: ' + this.tempPath);
    }

    const effects = Array.from(this.effects, ([_, effect]) => {
      if (typeof effect.args === 'boolean') return [];
      return [effect.name, ...effect.args];
    }).reduce((pV, cV) => pV.concat(cV), []);
    if (ss) effects.push('trim', ss.toString());
    debug('afx: ', effects);

    this.children.sox = spawn('sox', [
      this.tempPath,
      '-r',
      this.SAMPLE_RATE.toString(),
      '-c',
      this.AUDIO_CHANNELS.toString(),
      '-t',
      'raw',
      '-b',
      '16',
      '-e',
      'signed-integer',
      '-',
      ...effects,
    ]);

    this.streams = {};
    this.streams.sox = this.children.sox.stdin;
    this.streams.opus = this.children.sox.stdout.pipe(
      new prism.opus.Encoder({
        channels: this.AUDIO_CHANNELS,
        rate: this.SAMPLE_RATE,
        frameSize: this.FRAME_SIZE,
      })
    );
    this.player = this.player || new Player(this);
    this.streams.opus.pipe(this.player);

    this.streams.opus.on('end', () => this.player.onEnd());

    this.streams.sox.on('error', (e: Error) => this.onError(e));
    this.streams.opus.on('error', (e: Error) => this.onError(e));
  }

  public playerKill() {
    if (this.queue.length === 0) return (this.currentlyPlaying = false);
    debug('another stream available, playing');
    const stream = this.queue.shift();
    this.currentlyPlaying = stream;
    this.start();
  }

  public async playURL(url: string) {
    let result: Stream | boolean = false;

    for (const format of this.formats) {
      const res = url.match(format.regex);
      if (!res || res.length === 0) continue;

      let streamOrFalse: Stream | false;
      try {
        streamOrFalse = await format.onMatch(url);
        if (!streamOrFalse) continue;
      } catch (err) {
        dbg(`error on ${format.printName} format`);
        continue;
      }

      debug(`submitted url matched to ${format.printName} format, yay!`);
      result = streamOrFalse;

      break;
    }

    if (result !== false) this.addStreamToQueue(result);
  }

  public restart() {
    if (!this.player || !this.currentlyPlaying) return;

    const ms = this.player.position;
    this.player.kill(true);
    this.player.ss = ms;
    this.restartTime = Date.now();
    debug('restart call, time: ' + ms + 'ms');

    if (this.currentlyPlaying) this.start(ms / 1000);
  }

  public addStreamToQueue(str: Stream) {
    if (this.queue.length === 0 && !this.currentlyPlaying)
      return (this.currentlyPlaying = str), this.start();
    this.queue.push(str);
  }

  private killPrevious(hasRestarted: boolean = false) {
    if (this.streams.opus) this.streams.opus.unpipe(this.player);

    Object.values(this.children).forEach((c: ChildProcess) => c.kill());
    this.children = {};

    if (!hasRestarted && this.tempPath)
      unlinkSync(this.tempPath), (this.tempPath = '');
  }

  public kill() {
    if (this.player)
      this.player.kill();
    this.killPrevious();
    this.connection.kill();
    this.application.voices.delete(this.channel.guildId);
  }
}

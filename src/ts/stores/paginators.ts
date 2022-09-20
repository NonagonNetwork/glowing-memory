import { BaseSet } from 'detritus-client/lib/collections';
import { Context } from 'detritus-client/lib/command';
import { ClientEvents } from 'detritus-client/lib/constants';
import { InteractionContext } from 'detritus-client/lib/interaction';
import { Channel } from 'detritus-client/lib/structures';

import { Application } from '../application';
import { Paginator, PaginatorOptions } from '../utils';
import { Store } from './store';

const MAXIMUM_PAGINATORS = 4;

class PaginatorsStore extends Store<string, BaseSet<Paginator>> {
  public create(ctx: Context | InteractionContext, options: PaginatorOptions) {
    if (!ctx.channelId)
      throw new Error('paginator cannot be created');
    if (!this.has(ctx.channelId))
      this.set(ctx.channelId, new BaseSet());

    const paginator = new Paginator(ctx, options);
    const paginators = this.get(ctx.channelId);
    if (paginators) {
      paginators.add(paginator);
      while (paginators.length > MAXIMUM_PAGINATORS)
        paginators.first()?.kill();
    }
    return paginator;
  }

  private onChannelDelete(channel: Channel) {
    if (this.has(channel.id)) {
      for (const paginator of Object.values(this.get(channel.id)!))
        paginator.kill();
      this.delete(channel.id);
    }
  }

  public onApplication(application: Application): void {
    application.clusterClient.on(ClientEvents.CHANNEL_DELETE, ({ channel }) => {
      this.onChannelDelete(channel);
    });

    application.clusterClient.on(ClientEvents.GUILD_DELETE, ({ channels }) => {
      if (!channels) return;
      for (const [ _, channel ] of channels)
        this.onChannelDelete(channel);
    })
  }
}

export default new PaginatorsStore();
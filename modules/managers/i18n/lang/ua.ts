export default {
  "commands": {
    "settings": {
      "unknown": "невідома налаштування.",
      "not-null": "це налаштування не може бути видалено.",
      "set": "виставив `{0}` на `{1}`.",
      "current": "поточні налаштування для цього сервера.",
      "no-value": "[немає значення]"
    },

    "feedback": {
      "fail": "не вдалося відправити відгук.",
      "success": "дякую! ваш відгук було надіслано на наш сервер."
    },

    "module": {
      "assigned": "поставив модуль {0}!",
      "destroy": "зупиняю модуль...",
      "switched": "змінив на модуль {0}!"
    },

    "no-issue-url": "відправляй проблеми безпосередньо до хосту.",

    "ping": {
      "pong": "понг!",
      "unit": "мс",
      "footer": "shard ID: {0}"
    },

    "uptime": {
      "secret": "мучаюся вже {0}",
      "res": "працюю вже {0}",

      "units": [
        "мс",
        "сек",
        "мин",
        "ч",
        "д"
      ]
    },

    "corrupt": {
      "current-infrequency": "поточна нечастота: `{0}`.",

      "invalid-mode": "невірний режим. режимів доступно: `{0}`.",
      "current-mode": "поточний режим: `{0}`.",

      "current-rand-sample": "поточний rand sample: `{0}`.",

      "enabled": "корупція увімкнена. (гучність знижена до `{0}%` для уникнення проблем зі слухом.)",
      "disabled": "корупція вимкнена."
    },

    "effect": {
      "add": "доданий ефект `{0}`!",
      "clear": "ефекти очищені!",
      "remove": "видалено ефект `{0}`!",
      "set": "виставив `{0}` на `{1}`!",

      "list-options": "список опцій",
      "set-option": "виставити опцію",
      "get-option": "отримати опцію",
      "effect-id": "ID ефекту: {0} ({1})",
      "available-effects": "доступні ефекти",
      "options-for": "опції для `{0}`",
      "effects": "ефекти"
    },

    "nothing-is-playing": "наразі нічого не грає.",
    "voice-leave": "ще почуємось.",
    "current-volume": "поточна гучність: `{0}`%.",
    "current-packet-loss": "поточна втрата пакетів: `{0}`%.",
    "current-bitrate": "поточний битрейт: `{0}`.",
    "skipped": "пропущено!",
    "play-sfx": "граю `{0}`.",
    "join-msg": "приф!",
    "url-or-file": "ты повинен вставити URL або завантажити файл.",
    "query-not-found": "не знайдено.",

    "queue": {
      "nothing": "у черзі зараз порожньо.",
      "remove": "видалено `{0}` з черги!",
      "clear": "черга очищена!",
      "paginator": "черга - {0}"
    },

    "argument-error": "аргументна помилка.",
    "missing-required-parameter": "пропущено необхідний параметр."
  },

  "runtime-error": "помилка середовища виконання!!",

  "voice-check": {
    "bot-not-in-voice": "я не підключений.",
    "voice-not-init": "голос ще не ініціалізований!",
    "member-not-in-voice": "ти не в голосовому каналі.",
    "not-enough-perms-send-messages": "недостатньо прав для надсилання повідомлень у цей текстовий канал.",
    "not-enough-perms-speak": "недостатньо прав для розмови у цьому голосовому каналі.",
    "already-connected": "уже підключений до голосового каналу на цьому сервері."
  },

  "effects-mgr": {
    "not-found": "зазначений ефект не знайдено.",
    "stack-overflow": "занадто много ефектів!",
    "stack-underflow": "занадто мало ефектів!",
    "option-not-found": "зазначена опція ефекту не знайдена.",
    "value-undefined": "необхідно надати значення",
    "out-of-range": "дано значення поза діапазоном `[{0}; {1}]`",
    "members-overflow": "досягнуто ліміту користувачів каналу."
  },

  "queue": {
    "url-unsupported": "запитаний URL не підтримується.",
    "not-found": "зазначений предмет не знайдено."
  },

  "corrupt-mode-not-allowed": "ти не можеш увімкнути режим корупції. (якщо ти хочеш ризикнути чужим і своїм слухом, вистави опцію `allowCorrupt` на `true` і перепідключи бота.)",
  "invalid-number": "надано невірне цифрове значення.",
  "page": "сторінка {0}/{1}",

  "voice-modules": {
    "no-active": "немає модуля.",
    "not-found": "зазначений модуль не знайдено. {0}"
  }
};
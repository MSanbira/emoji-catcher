const EmojiCatcher = {};
EmojiCatcher.testMode = false;
EmojiCatcher.msIntervalToNextEmoji = 1000 * 60 * (EmojiCatcher.testMode ? 0.5 : 5);

EmojiCatcher.totalChance = EmojiCatcherData.emojis.reduce(
  (accumulator, emoji) => {
    let accumulatorNum = Number.isInteger(accumulator)
      ? accumulator
      : accumulator.chance;
    return accumulatorNum + emoji.chance;
  }
);

EmojiCatcher.sortedEmojis = EmojiCatcherData.emojis.sort(
  (a, b) => b.chance - a.chance
);

EmojiCatcher.init = () => {
  EmojiCatcher.getAndSetNextEmoji();

  if(EmojiCatcher.testMode) {
    EmojiCatcher.chanceTester(1000);
  }
};

EmojiCatcher.getEmojiObjByChance = () => {
  let chanceCount = 0;
  let chanceSelectedNum = Math.random() * EmojiCatcher.totalChance;
  for (const emoji of EmojiCatcher.sortedEmojis) {
    if (chanceSelectedNum <= emoji.chance + chanceCount) {
      return emoji;
    }
    chanceCount += emoji.chance;
  }

  return EmojiCatcherData.bugEmoji;
};

EmojiCatcher.getEmojiObjByEmoji = (emoji) => {
  return (
    EmojiCatcher.sortedEmojis.find((eo) => eo.emoji === emoji) ||
    EmojiCatcherData.bugEmoji
  );
};

EmojiCatcher.getAndSetNextEmoji = () => {
  EmojiCatcher.getNextEmoji((nextEmoji) => {
    EmojiCatcher.nextEmoji = nextEmoji;
    const currentDateTime = new Date().getTime();
    if (EmojiCatcher.nextEmoji) {
      const difference = EmojiCatcher.nextEmoji.dateTime - currentDateTime;
      if (difference > 0) {
        setTimeout(EmojiCatcher.checkAndShowNextEmoji, difference);
      } else {
        EmojiCatcher.setNewNextEmoji();
      }
    } else {
      EmojiCatcher.setNewNextEmoji();
    }
  });
};

EmojiCatcher.checkAndShowNextEmoji = () => {
  EmojiCatcher.getNextEmoji((nextEmoji) => {
    if (EmojiCatcher.nextEmoji.dateTime === nextEmoji.dateTime) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "create",
          emoji: nextEmoji.emoji,
        });
      });
    }

    EmojiCatcher.setNewNextEmoji();
  });
};

EmojiCatcher.setNewNextEmoji = () => {
  EmojiCatcher.nextEmoji = {
    dateTime: new Date().getTime() + EmojiCatcher.msIntervalToNextEmoji,
    emoji: EmojiCatcher.getEmojiObjByChance().emoji,
  };
  EmojiCatcher.setNextEmoji();
  setTimeout(
    EmojiCatcher.checkAndShowNextEmoji,
    EmojiCatcher.msIntervalToNextEmoji
  );
};

// Storage functions

EmojiCatcher.getNextEmoji = (returnFunction = () => {}) => {
  chrome.storage.sync.get(["EmojiCatcherNextEmoji"], (result) => {
    returnFunction(result.EmojiCatcherNextEmoji);
  });
};

EmojiCatcher.setNextEmoji = (returnFunction = () => {}) => {
  chrome.storage.sync.set(
    { EmojiCatcherNextEmoji: EmojiCatcher.nextEmoji },
    returnFunction
  );
};

// Testing functions

EmojiCatcher.chanceTester = (num) => {
    const emojisArr = {};
    for (let i = 0; i < num; i++) {
      const selected = EmojiCatcher.getEmojiObjByChance();
      emojisArr[selected.chance + selected.title] =
        (emojisArr[selected.chance + selected.title] || 0) + 1;
    }
  
    console.log("chance test: ", emojisArr);
};

EmojiCatcher.init();

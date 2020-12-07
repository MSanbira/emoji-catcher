const EmojiCatcher = {};
EmojiCatcher.isTestMode = true;
EmojiCatcher.isResetSavedData = false;
EmojiCatcher.msIntervalToNextEmoji =
  1000 * 60 * (EmojiCatcher.isTestMode ? 0.3 : 5);

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

  if (EmojiCatcher.isTestMode) {
    EmojiCatcher.chanceTester(EmojiCatcher.totalChance);
    EmojiCatcher.uniqKeysTest();
  }

  if (EmojiCatcher.isResetSavedData) {
    EmojiCatcher.savedData = EmojiCatcherSavedDataTemplate;
    EmojiCatcher.setSavedData();
  }

  chrome.runtime.onMessage.addListener((req, _sender) => {
    console.log("msg: ", req);
    EmojiCatcher.handleMessage(req);
  });
};

EmojiCatcher.handleMessage = (req) => {
  if (req.action === "click") {
    EmojiCatcher.getAndSaveEmojiClick(req.emoji, req.msUntilClick);
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

EmojiCatcher.getAndSaveEmojiClick = (emoji, msUntilClick) => {
  EmojiCatcher.getSavedData(() => {
    const emojiObj = EmojiCatcher.getEmojiObjByEmoji(emoji);
    EmojiCatcher.savedData.emojis.push(emoji);
    (EmojiCatcher.savedData.points += emojiObj.points), 0;
    EmojiCatcher.savedData.achievements = [
      ...EmojiCatcher.savedData.achievements,
      ...EmojiCatcher.getNewAchievements(),
    ];
    EmojiCatcher.savedData.stats = EmojiCatcher.updateStats(
      msUntilClick,
      EmojiCatcher.savedData
    );
    EmojiCatcher.setSavedData();
  });
};

EmojiCatcher.getNewAchievements = () => {
  const newAchievements = [];
  const potential = EmojiCatcherData.achievements.filter(
    (a) => !EmojiCatcher.savedData.achievements.includes(a.icon)
  );
  for (const achievement of potential) {
    if (EmojiCatcher.checkAchievement(achievement)) {
      newAchievements.push(achievement.icon);
    }
  }

  return newAchievements;
};

EmojiCatcher.checkAchievement = (achievement) => {
  switch (achievement.condition.check) {
    case "points":
      return achievement.condition.for <= EmojiCatcher.savedData.points;
    case "emojis":
      const emojiCount = EmojiCatcher.savedData.emojis.filter(
        (emoji) => emoji === achievement.condition.type
      ).length;
      return achievement.condition.for <= emojiCount;
    case "types":
      const uniqueEmojis = EmojiCatcher.savedData.emojis.filter(
        (v, i, a) => a.indexOf(v) === i
      );
      return achievement.condition.for <= uniqueEmojis;
    default:
      return false;
  }
};

EmojiCatcher.updateStats = (msUntilClick, savedData) => {
  const updated = {};
  updated.avgTimeToClick =
    (savedData.stats.avgTimeToClick + msUntilClick) / savedData.emojis.length;
  updated.lastSecClick =
    savedData.stats.lastSecClick + msUntilClick > 9000 ? 1 : 0;
  updated.firstSecClick =
    savedData.stats.firstSecClick + msUntilClick < 1000 ? 1 : 0;
  updated.avgPointsPerClick = savedData.points / savedData.emojis.length;

  return updated;
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
          emoji: EmojiCatcher.getEmojiObjByEmoji(nextEmoji.emoji),
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

EmojiCatcher.getSavedData = (returnFunction = () => {}) => {
  chrome.storage.sync.get(["EmojiCatcherSavedData"], (result) => {
    EmojiCatcher.savedData = result.EmojiCatcherSavedData;
    if (!EmojiCatcher.savedData) {
      EmojiCatcher.savedData = EmojiCatcherSavedDataTemplate;
    }
    returnFunction();
  });
};

EmojiCatcher.setSavedData = (returnFunction = () => {}) => {
  chrome.storage.sync.set(
    { EmojiCatcherSavedData: EmojiCatcher.savedData },
    returnFunction
  );
  console.log("saved", EmojiCatcher.savedData);
};

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

EmojiCatcher.uniqKeysTest = () => {
  const emojiKeys = [
    ...new Set(EmojiCatcherData.emojis.map((emojiObj) => emojiObj.emoji)),
  ];
  console.log(
    "uniq keys emojis: ",
    EmojiCatcherData.emojis.length === emojiKeys.length
  );
  const achievementKeys = [
    ...new Set(EmojiCatcherData.achievements.map((a) => a.icon)),
  ];
  console.log(
    "uniq keys emojis: ",
    EmojiCatcherData.achievements.length === achievementKeys.length
  );
};

EmojiCatcher.init();

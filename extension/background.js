const EmojiCatcher = {};
EmojiCatcher.isTestMode = false;
EmojiCatcher.simulation = EmojiCatcher.isTestMode ? [] : [];
EmojiCatcher.isResetSavedData = false;
EmojiCatcher.msIntervalToNextEmoji =
  1000 * 60 * (EmojiCatcher.isTestMode ? 0.3 : 5);
EmojiCatcher.shinyChance = EmojiCatcher.isTestMode ? 0.5 : 0.0001;
EmojiCatcher.missedEmojis = 0;
EmojiCatcher.nextEmojiTimeout = null;

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
  // on installation
  chrome.runtime.onInstalled.addListener(function () {
    EmojiCatcher.getSavedData(() => {
      if (EmojiCatcher.savedData.emojis.length === 0) {
        EmojiCatcher.onFirstInstall();
      }
    });

    return false;
  });

  EmojiCatcher.onFirstInstall = () => {
    alert(
      `Thank you for installing Emoji Catcher 🏆\n\nWe will now redirect you to a fresh Google page to show you how the game is played ✌️`
    );

    chrome.tabs.create({
      url: "https://google.com",
      active: true,
    });

    setTimeout(
      () =>
        EmojiCatcher.sendMessage({
          action: "createFirstEmoji",
          emoji: EmojiCatcher.getEmojiObjByEmoji(EmojiCatcherData.firstEmoji),
        }),
      3000
    );
  };

  EmojiCatcher.getIsPaused((isPaused) => {
    EmojiCatcher.isPaused = !!isPaused;
    EmojiCatcher.getAndSetNextEmoji();
  });

  if (EmojiCatcher.isTestMode) {
    EmojiCatcher.chanceTester(EmojiCatcher.totalChance);
    EmojiCatcher.uniqKeysTest();
  }

  if (EmojiCatcher.isResetSavedData) {
    EmojiCatcher.savedData = EmojiCatcherSavedDataTemplate;
    EmojiCatcher.setSavedData();
  }

  chrome.runtime.onMessage.addListener((req, _sender) => {
    console.log("req msg: ", req);
    EmojiCatcher.handleMessage(req);
  });
};

EmojiCatcher.handleMessage = (req) => {
  if (req.action === "click") {
    EmojiCatcher.awaitForClick = false;
    EmojiCatcher.getAndSaveEmojiClick(
      req.emoji,
      req.msUntilClick,
      req.isFirstEmoji,
      req.isShiny
    );
  }
  if (req.action === "isPausedChange") {
    EmojiCatcher.isPaused = req.isPaused;
  }
  if (req.action === "refresh") {
    EmojiCatcher.getIsPaused((isPaused) => {
      EmojiCatcher.isPaused = !!isPaused;
      EmojiCatcher.getAndSetNextEmoji();
    });
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

EmojiCatcher.getAndSaveEmojiClick = (
  emoji,
  msUntilClick,
  isFirstEmoji,
  isShiny
) => {
  EmojiCatcher.getSavedData(() => {
    const emojiObj = EmojiCatcher.getEmojiObjByEmoji(emoji);
    EmojiCatcher.savedData.emojis.push(emoji);
    EmojiCatcher.savedData.points += emojiObj.points * (isShiny ? 100 : 1);
    EmojiCatcher.savedData.achievements = [
      ...EmojiCatcher.savedData.achievements,
      ...EmojiCatcher.getNewAchievements(),
    ];
    if (isShiny) {
      EmojiCatcher.savedData.shiny.push(emoji);
    }
    EmojiCatcher.savedData.stats = EmojiCatcher.updatedStats(
      msUntilClick,
      EmojiCatcher.savedData,
      isFirstEmoji
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
      for (const type of achievement.condition.types) {
        const emojiCount = EmojiCatcher.savedData.emojis.filter(
          (emoji) => emoji === type
        ).length;
        if (achievement.condition.for > emojiCount) {
          return false;
        }
      }
      return true;
    case "types":
      const uniqueEmojis = EmojiCatcher.savedData.emojis.filter(
        (v, i, a) => a.indexOf(v) === i
      ).length;
      return achievement.condition.for <= uniqueEmojis;
    case "amount":
      return achievement.condition.for <= EmojiCatcher.savedData.emojis;
    default:
      return false;
  }
};

EmojiCatcher.updatedStats = (msUntilClick, savedData, isFirstEmoji) => {
  const updated = {};
  const emojiNum = savedData.emojis.length - 1;
  updated.missedEmojis =
    savedData.stats.missedEmojis + EmojiCatcher.missedEmojis;
  EmojiCatcher.missedEmojis = 0;
  if (!isFirstEmoji) {
    updated.firstSecClick =
      savedData.stats.firstSecClick + (msUntilClick < 1000 ? 1 : 0);
    updated.lastSecClick =
      savedData.stats.lastSecClick + (msUntilClick > 9000 ? 1 : 0);
    updated.avgTimeToClick =
      (savedData.stats.avgTimeToClick + msUntilClick) / Math.min(emojiNum, 2);
  }

  return { ...savedData.stats, ...updated };
};

EmojiCatcher.getAndSetNextEmoji = () => {
  EmojiCatcher.getNextEmoji((nextEmoji) => {
    EmojiCatcher.nextEmoji = nextEmoji;
    const currentDateTime = new Date().getTime();
    if (EmojiCatcher.nextEmoji) {
      const difference = EmojiCatcher.nextEmoji.dateTime - currentDateTime;
      if (difference > 0) {
        clearTimeout(EmojiCatcher.nextEmojiTimeout);
        EmojiCatcher.nextEmojiTimeout = setTimeout(
          EmojiCatcher.checkAndShowNextEmoji,
          difference
        );
      } else {
        EmojiCatcher.setNewNextEmoji();
      }
    } else {
      EmojiCatcher.setNewNextEmoji();
    }
  });
};

EmojiCatcher.checkAndShowNextEmoji = () => {
  if (!EmojiCatcher.isPaused) {
    if (EmojiCatcher.awaitForClick) {
      EmojiCatcher.missedEmojis++;
    }
    EmojiCatcher.awaitForClick = true;
    EmojiCatcher.sendMessage({
      action: "create",
      emoji: EmojiCatcher.getEmojiObjByEmoji(EmojiCatcher.nextEmoji.emoji),
      isShiny: Math.random() < EmojiCatcher.shinyChance,
    });
  }

  EmojiCatcher.setNewNextEmoji();
};

EmojiCatcher.setNewNextEmoji = () => {
  const emoji =
    EmojiCatcher.simulation.shift() || EmojiCatcher.getEmojiObjByChance().emoji;
  EmojiCatcher.nextEmoji = {
    dateTime: new Date().getTime() + EmojiCatcher.msIntervalToNextEmoji,
    emoji: emoji,
  };
  EmojiCatcher.setNextEmoji();
  clearTimeout(EmojiCatcher.nextEmojiTimeout);
  EmojiCatcher.nextEmojiTimeout = setTimeout(
    EmojiCatcher.checkAndShowNextEmoji,
    EmojiCatcher.msIntervalToNextEmoji
  );
};

// message Function

EmojiCatcher.sendMessage = (message) => {
  console.log("msg: ", message);
  chrome.tabs.query({ active: true }, (tabs) => {
    tabs.forEach((tab) => chrome.tabs.sendMessage(tab.id, message));
    console.log("tabs: ", tabs);
  });
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

EmojiCatcher.getIsPaused = (returnFunction = () => {}) => {
  chrome.storage.sync.get(["EmojiCatcherIsPaused"], (result) => {
    returnFunction(result.EmojiCatcherIsPaused);
  });
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
    "uniq keys achievements: ",
    EmojiCatcherData.achievements.length === achievementKeys.length
  );
};

EmojiCatcher.init();

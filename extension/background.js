const EmojiCollector = {};
EmojiCollector.isTestMode = false;
EmojiCollector.isResetSavedData = false;
EmojiCollector.msIntervalToNextEmoji =
  1000 * 60 * (EmojiCollector.isTestMode ? 0.3 : 5);
EmojiCollector.shinyChance = EmojiCollector.isTestMode ? 0.5 : 0.0001;

EmojiCollector.totalChance = EmojiCollectorData.emojis.reduce(
  (accumulator, emoji) => {
    let accumulatorNum = Number.isInteger(accumulator)
      ? accumulator
      : accumulator.chance;
    return accumulatorNum + emoji.chance;
  }
);

EmojiCollector.sortedEmojis = EmojiCollectorData.emojis.sort(
  (a, b) => b.chance - a.chance
);

EmojiCollector.init = () => {
  // on installation
  chrome.runtime.onInstalled.addListener(function () {
    alert(
      `Thank you for installing Emoji Collector 🏆\n
      We will now redirect you to a fresh Google page to show you how the game is played ✌️`
    );

    chrome.tabs.create({
      url: "https://google.com",
      active: true,
    });

    setTimeout(
      () =>
        EmojiCollector.sendMessage({
          action: "createFirstEmoji",
          emoji: EmojiCollector.getEmojiObjByEmoji(EmojiCollectorData.firstEmoji),
        }),
      3000
    );

    return false;
  });

  EmojiCollector.getAndSetNextEmoji();

  if (EmojiCollector.isTestMode) {
    EmojiCollector.chanceTester(EmojiCollector.totalChance);
    EmojiCollector.uniqKeysTest();
  }

  if (EmojiCollector.isResetSavedData) {
    EmojiCollector.savedData = EmojiCollectorSavedDataTemplate;
    EmojiCollector.setSavedData();
  }

  chrome.runtime.onMessage.addListener((req, _sender) => {
    console.log("msg: ", req);
    EmojiCollector.handleMessage(req);
  });
};

EmojiCollector.handleMessage = (req) => {
  if (req.action === "click") {
    EmojiCollector.getAndSaveEmojiClick(
      req.emoji,
      req.msUntilClick,
      req.isFirstEmoji,
      req.isShiny
    );
  }
};

EmojiCollector.getEmojiObjByChance = () => {
  let chanceCount = 0;
  let chanceSelectedNum = Math.random() * EmojiCollector.totalChance;
  for (const emoji of EmojiCollector.sortedEmojis) {
    if (chanceSelectedNum <= emoji.chance + chanceCount) {
      return emoji;
    }
    chanceCount += emoji.chance;
  }

  return EmojiCollectorData.bugEmoji;
};

EmojiCollector.getEmojiObjByEmoji = (emoji) => {
  return (
    EmojiCollector.sortedEmojis.find((eo) => eo.emoji === emoji) ||
    EmojiCollectorData.bugEmoji
  );
};

EmojiCollector.getAndSaveEmojiClick = (emoji, msUntilClick, isFirstEmoji, isShiny) => {
  EmojiCollector.getSavedData(() => {
    const emojiObj = EmojiCollector.getEmojiObjByEmoji(emoji);
    EmojiCollector.savedData.emojis.push(emoji);
    (EmojiCollector.savedData.points += emojiObj.points), 0;
    EmojiCollector.savedData.achievements = [
      ...EmojiCollector.savedData.achievements,
      ...EmojiCollector.getNewAchievements(),
    ];
    if (isShiny) {
      EmojiCollector.savedData.shiny.push(emoji);
    }
    EmojiCollector.savedData.stats = EmojiCollector.updateStats(
      msUntilClick,
      EmojiCollector.savedData,
      isFirstEmoji
    );
    EmojiCollector.setSavedData();
  });
};

EmojiCollector.getNewAchievements = () => {
  const newAchievements = [];
  const potential = EmojiCollectorData.achievements.filter(
    (a) => !EmojiCollector.savedData.achievements.includes(a.icon)
  );
  for (const achievement of potential) {
    if (EmojiCollector.checkAchievement(achievement)) {
      newAchievements.push(achievement.icon);
    }
  }

  return newAchievements;
};

EmojiCollector.checkAchievement = (achievement) => {
  switch (achievement.condition.check) {
    case "points":
      return achievement.condition.for <= EmojiCollector.savedData.points;
    case "emojis":
      const emojiCount = EmojiCollector.savedData.emojis.filter(
        (emoji) => emoji === achievement.condition.type
      ).length;
      return achievement.condition.for <= emojiCount;
    case "types":
      const uniqueEmojis = EmojiCollector.savedData.emojis.filter(
        (v, i, a) => a.indexOf(v) === i
      );
      return achievement.condition.for <= uniqueEmojis;
    default:
      return false;
  }
};

EmojiCollector.updateStats = (msUntilClick, savedData, isFirstEmoji) => {
  const updated = {};
  const emojiNum = savedData.emojis.length - 1;
  if (!isFirstEmoji) {
    updated.avgPointsPerClick = savedData.points / emojiNum;
    updated.firstSecClick =
      savedData.stats.firstSecClick + msUntilClick < 1000 ? 1 : 0;
    updated.lastSecClick =
      savedData.stats.lastSecClick + msUntilClick > 9000 ? 1 : 0;
    updated.avgTimeToClick =
      (savedData.stats.avgTimeToClick + msUntilClick) / emojiNum;
  }

  return { ...savedData.stats, ...updated };
};

EmojiCollector.getAndSetNextEmoji = () => {
  EmojiCollector.getNextEmoji((nextEmoji) => {
    EmojiCollector.nextEmoji = nextEmoji;
    const currentDateTime = new Date().getTime();
    if (EmojiCollector.nextEmoji) {
      const difference = EmojiCollector.nextEmoji.dateTime - currentDateTime;
      if (difference > 0) {
        setTimeout(EmojiCollector.checkAndShowNextEmoji, difference);
      } else {
        EmojiCollector.setNewNextEmoji();
      }
    } else {
      EmojiCollector.setNewNextEmoji();
    }
  });
};

EmojiCollector.checkAndShowNextEmoji = () => {
  EmojiCollector.getNextEmoji((nextEmoji) => {
    if (EmojiCollector.nextEmoji.dateTime === nextEmoji.dateTime) {
      EmojiCollector.sendMessage({
        action: "create",
        emoji: EmojiCollector.getEmojiObjByEmoji(nextEmoji.emoji),
        isShiny: Math.random() < EmojiCollector.shinyChance
      });
    }

    EmojiCollector.setNewNextEmoji();
  });
};

EmojiCollector.setNewNextEmoji = () => {
  EmojiCollector.nextEmoji = {
    dateTime: new Date().getTime() + EmojiCollector.msIntervalToNextEmoji,
    emoji: EmojiCollector.getEmojiObjByChance().emoji,
  };
  EmojiCollector.setNextEmoji();
  setTimeout(
    EmojiCollector.checkAndShowNextEmoji,
    EmojiCollector.msIntervalToNextEmoji
  );
};

// message Function

EmojiCollector.sendMessage = (message) => {
  console.log("msg: ", message);
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, message);
  });
};

// Storage functions

EmojiCollector.getSavedData = (returnFunction = () => {}) => {
  chrome.storage.sync.get(["EmojiCatcherSavedData"], (result) => {
    EmojiCollector.savedData = result.EmojiCatcherSavedData;
    if (!EmojiCollector.savedData) {
      EmojiCollector.savedData = EmojiCollectorSavedDataTemplate;
    }
    returnFunction();
  });
};

EmojiCollector.setSavedData = (returnFunction = () => {}) => {
  chrome.storage.sync.set(
    { EmojiCatcherSavedData: EmojiCollector.savedData },
    returnFunction
  );
  console.log("saved", EmojiCollector.savedData);
};

EmojiCollector.getNextEmoji = (returnFunction = () => {}) => {
  chrome.storage.sync.get(["EmojiCatcherNextEmoji"], (result) => {
    returnFunction(result.EmojiCatcherNextEmoji);
  });
};

EmojiCollector.setNextEmoji = (returnFunction = () => {}) => {
  chrome.storage.sync.set(
    { EmojiCatcherNextEmoji: EmojiCollector.nextEmoji },
    returnFunction
  );
};

// Testing functions

EmojiCollector.chanceTester = (num) => {
  const emojisArr = {};
  for (let i = 0; i < num; i++) {
    const selected = EmojiCollector.getEmojiObjByChance();
    emojisArr[selected.chance + selected.title] =
      (emojisArr[selected.chance + selected.title] || 0) + 1;
  }

  console.log("chance test: ", emojisArr);
};

EmojiCollector.uniqKeysTest = () => {
  const emojiKeys = [
    ...new Set(EmojiCollectorData.emojis.map((emojiObj) => emojiObj.emoji)),
  ];
  console.log(
    "uniq keys emojis: ",
    EmojiCollectorData.emojis.length === emojiKeys.length
  );
  const achievementKeys = [
    ...new Set(EmojiCollectorData.achievements.map((a) => a.icon)),
  ];
  console.log(
    "uniq keys emojis: ",
    EmojiCollectorData.achievements.length === achievementKeys.length
  );
};

EmojiCollector.init();

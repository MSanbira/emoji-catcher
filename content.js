const EmojiCatcher = {};

// Adding font
EmojiCatcher.font = new FontFace(
  "Press Start 2P",
  "url('https://fonts.gstatic.com/s/pressstart2p/v9/e3t4euO8T-267oIAQAu6jDQyK3nVivNm4I81.woff2')"
);
document.fonts.add(EmojiCatcher.font);

EmojiCatcher.sortedEmojis = EmojiCatcherData.emojis.sort(
  (a, b) => b.chance - a.chance
);

EmojiCatcher.init = () => {
  // Click listener
  document.addEventListener("click", (e) => {
    const clickedContainer = e.target.parentElement;
    if (
      clickedContainer &&
      clickedContainer.getAttribute("id") === "EmojiCatcherGameElement"
    ) {
      EmojiCatcher.handleEmojiClick(
        clickedContainer.getAttribute("data-emoji")
      );
    }
  });

  // Msg listener
  chrome.runtime.onMessage.addListener((req, _sender) => {
    console.log("msg: ", req);
    if (req.action === "create") {
      EmojiCatcher.createEmoji(EmojiCatcher.getEmojiObjByEmoji(req.emoji));
    }
  });
};

EmojiCatcher.getEmojiObjByEmoji = (emoji) => {
  return (
    EmojiCatcher.sortedEmojis.find((eo) => eo.emoji === emoji) ||
    EmojiCatcherData.bugEmoji
  );
};

EmojiCatcher.getNewAchievements = () => {
  const newAchievements = [];
  const savedIcons = EmojiCatcher.savedData.achievements.map((a) => a.icon);
  const potential = EmojiCatcherData.achievements.filter(
    (a) => !savedIcons.includes(a.icon)
  );
  for (const achievement of potential) {
    if (EmojiCatcher.checkAchievement(achievement)) {
      newAchievements.push({ icon: achievement.icon, text: achievement.text });
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

EmojiCatcher.createEmoji = (emojiObj = EmojiCatcherData.bugEmoji) => {
  EmojiCatcher.emojiElement = document.getElementById(
    "EmojiCatcherGameElement"
  );
  if (!EmojiCatcher.emojiElement) {
    EmojiCatcher.emojiElement = document.createElement("div");
    EmojiCatcher.emojiElement.setAttribute("id", "EmojiCatcherGameElement");
    EmojiCatcher.emojiElement.setAttribute("data-emoji", emojiObj.emoji);
    const divTop = parseInt((window.innerHeight - 150) * Math.random() + 50);
    const divLeft = parseInt((window.innerWidth - 150) * Math.random() + 50);
    EmojiCatcher.emojiElement.setAttribute(
      "style",
      `top: ${divTop}px; left: ${divLeft}px;`
    );
    document.body.appendChild(EmojiCatcher.emojiElement);
  }

  EmojiCatcher.emojiElement.innerHTML = `
        <div class="emojiBtn">${emojiObj.emoji}</div>
        <div class="emojiPoints">+${emojiObj.points}</div>
    `;

  EmojiCatcher.initialTimeout = setTimeout(() => {
    EmojiCatcher.emojiElement && EmojiCatcher.emojiElement.remove();
  }, 10000);
};

EmojiCatcher.handleEmojiClick = (emoji) => {
  EmojiCatcher.emojiElement.classList.add("clicked");
  clearTimeout(EmojiCatcher.initialTimeout);
  setTimeout(
    () => EmojiCatcher.emojiElement && EmojiCatcher.emojiElement.remove(),
    1000
  );

  console.log(emoji);
  EmojiCatcher.getAndSaveEmojiClick(emoji);
};

EmojiCatcher.getAndSaveEmojiClick = (emoji) => {
  EmojiCatcher.getSavedData(() => {
    const emojiObj = EmojiCatcher.getEmojiObjByEmoji(emoji);
    EmojiCatcher.savedData.emojis.push(emoji);
    (EmojiCatcher.savedData.points += emojiObj.points), 0;
    EmojiCatcher.savedData.achievements = [
      ...EmojiCatcher.savedData.achievements,
      ...EmojiCatcher.getNewAchievements(),
    ];
    EmojiCatcher.setSavedData();
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

EmojiCatcher.init();

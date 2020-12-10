const emojiGrid = document.querySelector(".emojis-grid");
const achievementsList = document.querySelector(".achievements-list");
const pointsDom = document.querySelector(".points");
const pauseBtn = document.querySelector(".pause-btn");

const EmojiCatcher = {};

EmojiCatcher.sortedEmojis = EmojiCatcherData.emojis.sort(
  (a, b) => b.chance - a.chance
);

function init() {
  EmojiCatcher.getIsPaused((isPaused) => {
    EmojiCatcher.isPaused = !!isPaused;
    EmojiCatcher.setPauseBtn();
  });
  EmojiCatcher.getSavedData(() => {
    EmojiCatcher.setPoints();
    EmojiCatcher.setEmojiGrid();
    EmojiCatcher.setAchievements();
  });

  pauseBtn.addEventListener('click', () => {
      EmojiCatcher.isPaused = !EmojiCatcher.isPaused;
      EmojiCatcher.setIsPaused();
      chrome.runtime.sendMessage({
        action: "isPausedChange",
        isPaused: EmojiCatcher.isPaused
      });
      EmojiCatcher.setPauseBtn();
  });
}

EmojiCatcher.setPauseBtn = () => {
  if (EmojiCatcher.isPaused) {
    pauseBtn.innerHTML = `
        <img src="/assets/images/play.svg" alt="pause" />
        play game
    `;
  } else {
    pauseBtn.innerHTML = `
        <img src="/assets/images/pause.svg" alt="pause" />
        pause game
    `;
  }
};

EmojiCatcher.setPoints = () => {
  pointsDom.innerHTML = EmojiCatcher.savedData.points.toLocaleString() + "pts";
};

EmojiCatcher.setEmojiGrid = () => {
  EmojiCatcher.sortedEmojis.forEach((emojiObj) => {
    const emojiCount = EmojiCatcher.formattedNumber(emojiObj.emoji);
    if (!!emojiCount) {
      const dataRareStr = `data-rare-status="${
        EmojiCatcherData.rareStatuses[emojiObj.rareStatus]
      }"`;
      emojiGrid.innerHTML += `
            <div 
                class="emoji" 
                ${!!emojiObj.rareStatus && dataRareStr}
                data-title="${emojiObj.title}"
            >
                <div class='icon ${
                  EmojiCatcher.isShiny(emojiObj.emoji) ? "shiny" : ""
                }'>
                    ${emojiObj.emoji}
                </div>
                ${emojiCount}
            </div>
        `;
    } else {
      emojiGrid.innerHTML += '<div class="emoji"></div>';
    }
  });
};

EmojiCatcher.setAchievements = () => {
  EmojiCatcher.savedData.achievements.forEach((achievement) => {
    const achievementObj = EmojiCatcherData.achievements.find(
      (a) => a.icon === achievement
    );
    achievementsList.innerHTML += `
            <div class="achievement">
                <div class="icon">${achievement}</div>
                <div class="description">${
                  achievementObj && achievementObj.text
                }</div>
            </div>
        `;
  });
};

EmojiCatcher.formattedNumber = (emoji) => {
  const emojiNum = EmojiCatcher.savedData.emojis.filter((e) => e === emoji)
    .length;
  if (emojiNum >= 1000000) {
    return `${parseInt(emojiNum / 1000000)}k`;
  } else if (emojiNum >= 1000) {
    return `${parseInt(emojiNum / 1000)}m`;
  }

  return emojiNum;
};

EmojiCatcher.isShiny = (emoji) => {
  return EmojiCatcher.savedData.shiny.includes(emoji);
};

EmojiCatcher.getEmojiObjByEmoji = (emoji) => {
  return (
    EmojiCatcher.sortedEmojis.find((eo) => eo.emoji === emoji) ||
    EmojiCatcherData.bugEmoji
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

EmojiCatcher.getIsPaused = (returnFunction = () => {}) => {
  chrome.storage.sync.get(["EmojiCatcherIsPaused"], (result) => {
    returnFunction(result.EmojiCatcherIsPaused);
  });
};

EmojiCatcher.setIsPaused = (returnFunction = () => {}) => {
  chrome.storage.sync.set(
    { EmojiCatcherIsPaused: EmojiCatcher.isPaused },
    returnFunction
  );
};

init();

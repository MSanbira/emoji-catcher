const emojiGrid = document.querySelector(".emojis-grid");
const achievementsList = document.querySelector(".achievements-list");
const pointsDom = document.querySelector(".points");

const EmojiCollector = {};

EmojiCollector.sortedEmojis = EmojiCollectorData.emojis.sort(
  (a, b) => b.chance - a.chance
);

function init() {
  EmojiCollector.getSavedData(() => {
    EmojiCollector.setPoints();
    EmojiCollector.setEmojiGrid();
    EmojiCollector.setAchievements();
  });
}

EmojiCollector.setPoints = () => {
  pointsDom.innerHTML =
    EmojiCollector.savedData.points.toLocaleString() + "pts";
};

EmojiCollector.setEmojiGrid = () => {
  EmojiCollector.sortedEmojis.forEach((emojiObj) => {
    const emojiCount = EmojiCollector.formattedNumber(emojiObj.emoji);
    if (!!emojiCount) {
      const dataRareStr = `data-rare-status="${
        EmojiCollectorData.rareStatuses[emojiObj.rareStatus]
      }"`;
      emojiGrid.innerHTML += `
            <div 
                class="emoji" 
                ${!!emojiObj.rareStatus && dataRareStr}
                data-title="${emojiObj.title}"
            >
                <div class='icon ${
                  EmojiCollector.isShiny(emojiObj.emoji) ? "shiny" : ""
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

EmojiCollector.setAchievements = () => {
    EmojiCollector.savedData.achievements.forEach((achievement) => {
        const achievementObj = EmojiCollectorData.achievements.find((a) => a.icon === achievement);
        achievementsList.innerHTML += `
            <div class="achievement">
                <div class="icon">${achievement}</div>
                <div class="description">${achievementObj && achievementObj.text}</div>
            </div>
        `;
    })
}

EmojiCollector.formattedNumber = (emoji) => {
  const emojiNum = EmojiCollector.savedData.emojis.filter((e) => e === emoji)
    .length;
  if (emojiNum >= 1000000) {
    return `${parseInt(emojiNum / 1000000)}k`;
  } else if (emojiNum >= 1000) {
    return `${parseInt(emojiNum / 1000)}m`;
  }

  return emojiNum;
};

EmojiCollector.isShiny = (emoji) => {
  return EmojiCollector.savedData.shiny.includes(emoji);
};

EmojiCollector.getEmojiObjByEmoji = (emoji) => {
  return (
    EmojiCollector.sortedEmojis.find((eo) => eo.emoji === emoji) ||
    EmojiCollectorData.bugEmoji
  );
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

init();

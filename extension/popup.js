const pages = document.querySelectorAll("section");
const emojiGrid = document.querySelector(".emojis-grid");
const achievementsList = document.querySelector(".achievements-list");
const pointsDom = document.querySelector(".points");
const statsDoms = document.querySelectorAll(".stat");

const pauseBtn = document.querySelector(".pause-btn");
const refreshBtn = document.querySelector(".refresh-btn");
const statsBtn = document.querySelector(".stats-btn");
const backBtn = document.querySelector(".back-btn");

const EmojiCatcher = {};

EmojiCatcher.sortedEmojis = EmojiCatcherData.emojis.sort(
  (a, b) => b.chance - a.chance
);

function init() {
  EmojiCatcher.refreshFromStorage();

  pauseBtn.addEventListener("click", () => {
    EmojiCatcher.isPaused = !EmojiCatcher.isPaused;
    EmojiCatcher.setIsPaused();
    chrome.runtime.sendMessage({
      action: "isPausedChange",
      isPaused: EmojiCatcher.isPaused,
    });
    EmojiCatcher.setPauseBtn();
  });

  refreshBtn.addEventListener("click", () => {
    refreshBtn.classList.add("spin");
    setTimeout(() => refreshBtn.classList.remove("spin"), 500);
    EmojiCatcher.refreshFromStorage();
  });

  statsBtn.addEventListener("click", () => {
    EmojiCatcher.changePage("statsPage");
  });

  backBtn.addEventListener("click", () => {
    EmojiCatcher.changePage("mainDisplay");
  });
}

EmojiCatcher.refreshFromStorage = () => {
  EmojiCatcher.getIsPaused((isPaused) => {
    EmojiCatcher.isPaused = !!isPaused;
    EmojiCatcher.setPauseBtn();
  });
  EmojiCatcher.getSavedData(() => {
    EmojiCatcher.setPoints();
    EmojiCatcher.setEmojiGrid();
    EmojiCatcher.setAchievements();
    EmojiCatcher.setStats();
  });
};

EmojiCatcher.changePage = (pageName) => {
  for (const page of pages) {
    if (page.getAttribute("id") === pageName) {
      page.classList.remove("hide");
    } else {
      page.classList.add("hide");
    }
  }
};

EmojiCatcher.setPauseBtn = () => {
  const playImg = pauseBtn.querySelector('img[alt="play"]');
  const pauseImg = pauseBtn.querySelector('img[alt="pause"]');
  const btnInnerText = pauseBtn.querySelector(".btn-inner-text");
  if (EmojiCatcher.isPaused) {
    playImg.classList.remove("hide");
    pauseImg.classList.add("hide");
    btnInnerText.innerText = "play game";
  } else {
    playImg.classList.add("hide");
    pauseImg.classList.remove("hide");
    btnInnerText.innerText = "pause game";
  }
};

EmojiCatcher.setPoints = () => {
  pointsDom.innerHTML = EmojiCatcher.savedData.points.toLocaleString() + "pts";
};

EmojiCatcher.setEmojiGrid = () => {
  emojiGrid.innerHTML = "";
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
                <div class='emoji-icon ${
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
  achievementsList.innerHTML = "";
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

EmojiCatcher.setStats = () => {
  const avgPoints =
    EmojiCatcher.savedData.points / EmojiCatcher.savedData.emojis.length;
  const statsAgg = {
    ...EmojiCatcher.savedData.stats,
    avgTimeToClick: `${parseInt(EmojiCatcher.savedData.stats.avgTimeToClick * 100) / 100.0}s`,
    emojisCaught: EmojiCatcher.savedData.emojis.length,
    shinyCaught: EmojiCatcher.savedData.shiny.length,
    pointsPerClick: `${parseInt(avgPoints * 100) / 100.0} points`,
    achievements: `${EmojiCatcher.savedData.achievements.length}/${EmojiCatcherData.achievements.length}`,
  };
  for (const statDom of statsDoms) {
    statDom.querySelector('.stats-data').innerText = statsAgg[statDom.getAttribute('data-stat-type')];
  }
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

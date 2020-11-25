const EmojiCatcher = {};

document.head.innerHTML += `<link rel="preconnect" href="https://fonts.gstatic.com">
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">`;

EmojiCatcher.style = document.querySelector("#EmojiCatcherStyle");
if (!EmojiCatcher.style) {
  EmojiCatcher.style = document.createElement("style");
  EmojiCatcher.style.setAttribute("id", "EmojiCatcherStyle");
  document.head.appendChild(EmojiCatcher.style);
}

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
  // Click listener
  document.addEventListener("click", (e) => {
    const clickedContainer = e.target.parentElement;
    if (clickedContainer.getAttribute("id") === "EmojiCatcherGameElement") {
      EmojiCatcher.handleEmojiClick(
        clickedContainer.getAttribute("data-emoji")
      );
    }
  });

  // Tests
  //   EmojiCatcher.createEmoji(EmojiCatcher.getEmojiByChance());
  setInterval(() => {
    EmojiCatcher.createEmoji(EmojiCatcher.getEmojiByChance());
  }, 1000 * 180);

  //   EmojiCatcher.chanceTester(1000);
};

EmojiCatcher.getEmojiByChance = () => {
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

  setTimeout(
    () => EmojiCatcher.emojiElement && EmojiCatcher.emojiElement.remove(),
    10000
  );
};

EmojiCatcher.handleEmojiClick = (emoji) => {
  console.log("clicked");
  EmojiCatcher.emojiElement.classList.add("clicked");
  setTimeout(
    () => EmojiCatcher.emojiElement && EmojiCatcher.emojiElement.remove(),
    1000
  );

  //TODO set emoji click
  console.log(emoji);
};

// chrome.runtime.onMessage.addListener((req, _sender) => {
//     ClicksOfUnicorns.emoji = req.emoji;
// });

// chrome.storage.sync.get(['isEmojiChanged'], function(result) {
//     if(!!result.isEmojiChanged) {
//         chrome.storage.sync.get(['ClicksOfUnicornsEmoji'], function(result) {
//             ClicksOfUnicorns.emoji = result.ClicksOfUnicornsEmoji;
//         });
//     }
// });

// CSS

EmojiCatcher.style.innerHTML = `
    #EmojiCatcherGameElement {
        position: fixed;
        top: 200px;
        left: 200px;
        z-index: 2147483647;
        opacity: 0;
        animation: emojiCatcherShow 10s linear 1;
    }
    #EmojiCatcherGameElement .emojiBtn {
        font-size: 40px;
        cursor: pointer;
        animation: emojiCatcherRotate 10s linear 1;
    }
    #EmojiCatcherGameElement .emojiPoints {
        font-family: 'Press Start 2P';
        display: none;
        font-size: 40px;
        color: #fafafa;
        -webkit-text-stroke: 2px #9e9e9e;
    }
    #EmojiCatcherGameElement.clicked {
        animation: emojiCatcherFloat 1s linear 1;
    }
    #EmojiCatcherGameElement.clicked .emojiBtn {
        display: none;
    }
    #EmojiCatcherGameElement.clicked .emojiPoints {
        display: block;
    }

    @keyframes emojiCatcherShow {
        0% {
            opacity: 0;
        }
        10%, 90% {
            opacity: 1;
        }
        100% {
            opacity: 0;
        }
    }

    @keyframes emojiCatcherRotate {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(-360deg);
        }
    }

    @keyframes emojiCatcherFloat {
        0% {
            opacity: 1;
        }
        75% {
            opacity: 1;
            transform: translate(0, -37.5px);
        }
        100% {
            opacity: 0;
            transform: translate(0, -50px);
        }
    }
`;

EmojiCatcher.chanceTester = (num) => {
  const emojisArr = {};
  for (let i = 0; i < num; i++) {
    const selected = EmojiCatcher.getEmojiByChance();
    emojisArr[selected.chance + selected.title] =
      (emojisArr[selected.chance + selected.title] || 0) + 1;
  }

  console.log("chance test: ", emojisArr);
};

EmojiCatcher.init();

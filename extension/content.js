const EmojiCatcher = {};

EmojiCatcher.bugEmoji = {
  emoji: "🐛",
  chance: 0,
  title: "You found a bug, consider reporting :]",
  points: 1,
  rareStatus: 3,
};

// Adding fonts
EmojiCatcher.font1 = new FontFace(
  "Press Start 2P",
  "url('https://fonts.gstatic.com/s/pressstart2p/v9/e3t4euO8T-267oIAQAu6jDQyK3nVivNm4I81.woff2')"
);
EmojiCatcher.fontBebas = new FontFace(
  "Bebas Neue",
  "url('https://fonts.gstatic.com/s/bebasneue/v2/JTUSjIg69CK48gW7PXoo9WdhyyTh89ZNpQ.woff2')"
);
document.fonts.add(EmojiCatcher.font1);
document.fonts.add(EmojiCatcher.fontBebas);

EmojiCatcher.init = () => {
  // Click listener
  document.addEventListener("click", (e) => {
    const clickedContainer = e.target.parentElement;
    if (
      clickedContainer &&
      clickedContainer.getAttribute("id") === "EmojiCatcherGameElement"
    ) {
      e.stopPropagation;
      EmojiCatcher.handleEmojiClick(
        clickedContainer.getAttribute("data-emoji")
      );
    }
  });

  // Msg listener
  chrome.runtime.onMessage.addListener((req, _sender) => {
    console.log("msg: ", req);
    EmojiCatcher.handleMessage(req);
  });
};

EmojiCatcher.handleMessage = (req) => {
  if (req.action === "create") {
    EmojiCatcher.createEmoji(req.emoji, req.isShiny);
  } else if (req.action === "createFirstEmoji") {
    EmojiCatcher.createFirstEmoji(req.emoji);
  }
};

EmojiCatcher.createEmoji = (emojiObj = EmojiCatcher.bugEmoji, isShiny) => {
  EmojiCatcher.emojiElement = document.getElementById(
    "EmojiCatcherGameElement"
  );
  if (!EmojiCatcher.emojiElement) {
    EmojiCatcher.emojiElement = document.createElement("div");
    EmojiCatcher.emojiElement.setAttribute("id", "EmojiCatcherGameElement");
    EmojiCatcher.emojiElement.setAttribute("data-emoji", emojiObj.emoji);
    let emojiPoints = emojiObj.points;
    if (isShiny) {
      EmojiCatcher.emojiElement.setAttribute("data-is-shiny", isShiny);
      emojiPoints *= 100;
    }
    const divTop = parseInt((window.innerHeight - 150) * Math.random() + 50);
    const divLeft = parseInt((window.innerWidth - 150) * Math.random() + 50);
    EmojiCatcher.emojiElement.setAttribute(
      "style",
      `top: ${divTop}px; left: ${divLeft}px;`
    );
    document.body.appendChild(EmojiCatcher.emojiElement);

    EmojiCatcher.emojiElement.innerHTML = `
        <div class="EC-emoji-btn ${isShiny ? "shiny" : ""}">
          ${emojiObj.emoji}
        </div>
        ${
          isShiny
            ? '<div class="EC-shiny-stars"><div></div><div></div><div></div></div>'
            : ""
        }
        <div class="EC-emoji-points">+${emojiPoints}</div>
    `;

    EmojiCatcher.DateTimeWhenCreated = new Date().getTime();
    EmojiCatcher.initialTimeout = setTimeout(() => {
      EmojiCatcher.emojiElement && EmojiCatcher.emojiElement.remove();
    }, 10000);
  }
};

EmojiCatcher.handleEmojiClick = (emoji) => {
  EmojiCatcher.msUntilClick =
    new Date().getTime() - EmojiCatcher.DateTimeWhenCreated;
  EmojiCatcher.emojiElement.classList.add("clicked");
  EmojiCatcher.isFirstEmoji = !!EmojiCatcher.emojiElement.getAttribute(
    "data-is-first-emoji"
  );
  EmojiCatcher.isShiny = !!EmojiCatcher.emojiElement.getAttribute(
    "data-is-shiny"
  );
  clearTimeout(EmojiCatcher.initialTimeout);
  if (EmojiCatcher.isFirstEmoji) {
    EmojiCatcher.openWelcomePopup();
  }
  setTimeout(() => {
    EmojiCatcher.emojiElement && EmojiCatcher.emojiElement.remove();
  }, 1000);

  console.log(emoji, EmojiCatcher.msUntilClick);
  chrome.runtime.sendMessage({
    action: "click",
    emoji: emoji,
    isFirstEmoji: EmojiCatcher.isFirstEmoji,
    msUntilClick: EmojiCatcher.msUntilClick,
    isShiny: EmojiCatcher.isShiny,
  });
};

EmojiCatcher.createFirstEmoji = (emojiObj = EmojiCatcher.bugEmoji) => {
  EmojiCatcher.emojiElement = document.getElementById(
    "EmojiCatcherGameElement"
  );
  if (!EmojiCatcher.emojiElement) {
    EmojiCatcher.emojiElement = document.createElement("div");
    EmojiCatcher.emojiElement.setAttribute("id", "EmojiCatcherGameElement");
    EmojiCatcher.emojiElement.setAttribute("data-emoji", emojiObj.emoji);
    EmojiCatcher.emojiElement.setAttribute("data-is-first-emoji", true);
    document.body.appendChild(EmojiCatcher.emojiElement);

    EmojiCatcher.emojiElement.innerHTML = `
        <div class="EC-emoji-btn">${emojiObj.emoji}</div>
        <div class="EC-emoji-points">+${emojiObj.points}</div>
        <div class="EC-click-me">< click me</div>
    `;

    EmojiCatcher.DateTimeWhenCreated = new Date().getTime();
  }
};

EmojiCatcher.openWelcomePopup = () => {
  document.head.innerHTML += `<link rel="preconnect" href="https://fonts.gstatic.com">
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" rel="stylesheet">`;
  EmojiCatcher.welcomePopup = document.createElement("div");
  EmojiCatcher.welcomePopup.setAttribute("id", "EmojiCatcherWelcomePopup");
  const urlConffety = chrome.extension.getURL("assets/images/conffety.png");
  const urlClose = chrome.extension.getURL("assets/images/close.svg");
  const urlGif = chrome.extension.getURL("assets/images/gif-welcome.gif");
  EmojiCatcher.welcomePopup.innerHTML = `
    <header>
      <img class="EC-header-bg" src="${urlConffety}" alt="bg">
      <h1 class="EC-title">Welcome to Emoji Catcher!</h1>
      <div class="EC-exit-btn"><img src="${urlClose}" alt="close"></div>
    </header>
    <section>
      <p class="EC-sub-title">
        Click the <span class="EC-blue-text">extension icon</span> whenever you</br> want to catch up on your progress
      </p>
      <div class="EC-gif-container"><img src="${urlGif}" alt="open extensions"></div>
      <div class="EC-btn">awesome, got it!</div>
    </section>
  `;
  document.body.appendChild(EmojiCatcher.welcomePopup);
  EmojiCatcher.welcomePopup.addEventListener("click", (event) => {
    if (
      event.target.classList.contains("EC-btn") ||
      event.target.classList.contains("EC-exit-btn") ||
      event.target.parentElement.classList.contains("EC-exit-btn")
    ) {
      EmojiCatcher.welcomePopup.remove();
    }
  });
};

EmojiCatcher.init();

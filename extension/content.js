const EmojiCatcher = {};

EmojiCatcher.bugEmoji = {
  emoji: "🐛",
  chance: 0,
  title: "You found a bug, consider reporting :]",
  points: 1,
  rareStatus: 3,
};

// Adding font
EmojiCatcher.font = new FontFace(
  "Press Start 2P",
  "url('https://fonts.gstatic.com/s/pressstart2p/v9/e3t4euO8T-267oIAQAu6jDQyK3nVivNm4I81.woff2')"
);
document.fonts.add(EmojiCatcher.font);

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
    if(isShiny) {
      EmojiCatcher.emojiElement.setAttribute("data-is-shiny", isShiny);
    }
    const divTop = parseInt((window.innerHeight - 150) * Math.random() + 50);
    const divLeft = parseInt((window.innerWidth - 150) * Math.random() + 50);
    EmojiCatcher.emojiElement.setAttribute(
      "style",
      `top: ${divTop}px; left: ${divLeft}px;`
    );
    document.body.appendChild(EmojiCatcher.emojiElement);

    EmojiCatcher.emojiElement.innerHTML = `
        <div class="EC-emoji-btn ${isShiny ? "shiny" : ""}">${
      emojiObj.emoji
    }</div>
        <div class="EC-emoji-points">+${emojiObj.points}</div>
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
  setTimeout(
    () => EmojiCatcher.emojiElement && EmojiCatcher.emojiElement.remove(),
    1000
  );

  console.log(emoji, EmojiCatcher.msUntilClick);
  chrome.runtime.sendMessage({
    action: "click",
    emoji: emoji,
    isFirstEmoji: EmojiCatcher.isFirstEmoji,
    msUntilClick: EmojiCatcher.msUntilClick,
    isShiny: EmojiCatcher.isShiny
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

EmojiCatcher.init();

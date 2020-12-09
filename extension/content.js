const EmojiCollector = {};

EmojiCollector.bugEmoji = {
  emoji: "🐛",
  chance: 0,
  title: "You found a bug, consider reporting :]",
  points: 1,
  rareStatus: 3,
};

// Adding font
EmojiCollector.font = new FontFace(
  "Press Start 2P",
  "url('https://fonts.gstatic.com/s/pressstart2p/v9/e3t4euO8T-267oIAQAu6jDQyK3nVivNm4I81.woff2')"
);
document.fonts.add(EmojiCollector.font);

EmojiCollector.init = () => {
  // Click listener
  document.addEventListener("click", (e) => {
    const clickedContainer = e.target.parentElement;
    if (
      clickedContainer &&
      clickedContainer.getAttribute("id") === "EmojiCollectorGameElement"
    ) {
      e.stopPropagation;
      EmojiCollector.handleEmojiClick(
        clickedContainer.getAttribute("data-emoji")
      );
    }
  });

  // Msg listener
  chrome.runtime.onMessage.addListener((req, _sender) => {
    console.log("msg: ", req);
    EmojiCollector.handleMessage(req);
  });
};

EmojiCollector.handleMessage = (req) => {
  if (req.action === "create") {
    EmojiCollector.createEmoji(req.emoji, req.isShiny);
  } else if (req.action === "createFirstEmoji") {
    EmojiCollector.createFirstEmoji(req.emoji);
  }
};

EmojiCollector.createEmoji = (emojiObj = EmojiCollector.bugEmoji, isShiny) => {
  EmojiCollector.emojiElement = document.getElementById(
    "EmojiCollectorGameElement"
  );
  if (!EmojiCollector.emojiElement) {
    EmojiCollector.emojiElement = document.createElement("div");
    EmojiCollector.emojiElement.setAttribute("id", "EmojiCollectorGameElement");
    EmojiCollector.emojiElement.setAttribute("data-emoji", emojiObj.emoji);
    if(isShiny) {
      EmojiCollector.emojiElement.setAttribute("data-is-shiny", isShiny);
    }
    const divTop = parseInt((window.innerHeight - 150) * Math.random() + 50);
    const divLeft = parseInt((window.innerWidth - 150) * Math.random() + 50);
    EmojiCollector.emojiElement.setAttribute(
      "style",
      `top: ${divTop}px; left: ${divLeft}px;`
    );
    document.body.appendChild(EmojiCollector.emojiElement);

    EmojiCollector.emojiElement.innerHTML = `
        <div class="EC-emoji-btn ${isShiny ? "shiny" : ""}">${
      emojiObj.emoji
    }</div>
        <div class="EC-emoji-points">+${emojiObj.points}</div>
    `;

    EmojiCollector.DateTimeWhenCreated = new Date().getTime();
    EmojiCollector.initialTimeout = setTimeout(() => {
      EmojiCollector.emojiElement && EmojiCollector.emojiElement.remove();
    }, 10000);
  }
};

EmojiCollector.handleEmojiClick = (emoji) => {
  EmojiCollector.msUntilClick =
    new Date().getTime() - EmojiCollector.DateTimeWhenCreated;
  EmojiCollector.emojiElement.classList.add("clicked");
  EmojiCollector.isFirstEmoji = !!EmojiCollector.emojiElement.getAttribute(
    "data-is-first-emoji"
  );
  EmojiCollector.isShiny = !!EmojiCollector.emojiElement.getAttribute(
    "data-is-shiny"
  );
  clearTimeout(EmojiCollector.initialTimeout);
  setTimeout(
    () => EmojiCollector.emojiElement && EmojiCollector.emojiElement.remove(),
    1000
  );

  console.log(emoji, EmojiCollector.msUntilClick);
  chrome.runtime.sendMessage({
    action: "click",
    emoji: emoji,
    isFirstEmoji: EmojiCollector.isFirstEmoji,
    msUntilClick: EmojiCollector.msUntilClick,
    isShiny: EmojiCollector.isShiny
  });
};

EmojiCollector.createFirstEmoji = (emojiObj = EmojiCollector.bugEmoji) => {
  EmojiCollector.emojiElement = document.getElementById(
    "EmojiCollectorGameElement"
  );
  if (!EmojiCollector.emojiElement) {
    EmojiCollector.emojiElement = document.createElement("div");
    EmojiCollector.emojiElement.setAttribute("id", "EmojiCollectorGameElement");
    EmojiCollector.emojiElement.setAttribute("data-emoji", emojiObj.emoji);
    EmojiCollector.emojiElement.setAttribute("data-is-first-emoji", true);
    document.body.appendChild(EmojiCollector.emojiElement);

    EmojiCollector.emojiElement.innerHTML = `
        <div class="EC-emoji-btn">${emojiObj.emoji}</div>
        <div class="EC-emoji-points">+${emojiObj.points}</div>
        <div class="EC-click-me">< click me</div>
    `;

    EmojiCollector.DateTimeWhenCreated = new Date().getTime();
  }
};

EmojiCollector.init();

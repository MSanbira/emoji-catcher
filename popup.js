

function init() {
}

// function getEmojiFromStorage() {
//     chrome.storage.sync.get(['isEmojiChanged'], function(result) {
//         isEmojiChanged = !!result.isEmojiChanged;
//         if(isEmojiChanged) {
//             chrome.storage.sync.get(['ClicksOfUnicornsEmoji'], function(result) {
//                 setEmojiSelectedUI(result.ClicksOfUnicornsEmoji);
//             });  
//         }
//         else {
//             setEmojiSelectedUI('🦄');
//         }
//     });    
// }


// function handleSendMessage(emoji) {
//     chrome.tabs.query({currentWindow: true, active: true}, (tabs) => {
//         chrome.tabs.sendMessage(tabs[0].id, {emoji: emoji});
//     });
// }

// function setUniEmoji(emoji) {
//     chrome.storage.sync.set({ClicksOfUnicornsEmoji: emoji, isEmojiChanged: true}, function() {
//         console.log('Value is set to: ' + emoji);
//     });

//     handleSendMessage(emoji);
// }

init();

// sends message to background script if password field is triggered in listener
const execNotification = () => {
    const response = chrome.runtime.sendMessage({greeting: "hello"});
};


// checks if link is clicked from notification in background scripts and opens a window
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {

      if (request.action === "q") {
            window.open("https://view.ceros.com/fidelity-interactive/password-security-quiz/p/1");
            sendResponse({farewell: "goodbye"})
        } else if (request.action === "l") {
            window.open("https://help.lafayette.edu/guidelines-for-strong-passwords/");
            sendResponse({farewell: "goodbye"})
        };
    }
);


// check if input type password is available or else extension will trigger for every page
if (document.querySelector('input[type="password"]')) {
    document.querySelector('input[type="password"]').addEventListener('input',execNotification,{once:true});
};

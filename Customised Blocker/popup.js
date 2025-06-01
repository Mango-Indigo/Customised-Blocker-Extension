//clicking the button goes to the options page
// dynamic popup https://developer.chrome.com/docs/extensions/develop/ui/add-popup
document.querySelector('#go-to-options').addEventListener('click', function() {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open(chrome.runtime.getURL('options.html'));
  }
});


let screenshotCount = {};

// Listen for tab updates and take screenshots if enabled
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//   console.log('Tab updated:', tabId, changeInfo, tab);
  if (changeInfo.status === 'complete') {
    chrome.storage.local.get(['screenshotsEnabled'], (result) => {
    //   console.log('Screenshots enabled status:', result.screenshotsEnabled);
      if (result.screenshotsEnabled) {
        const url = tab.url;
        // console.log('Tab URL:', url);

        // Check if the URL is defined and not a restricted one
        if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
          // Add a 300ms delay before taking the screenshot
          setTimeout(() => {
            console.log('Taking screenshot for URL:', url);
            takeScreenshot(tab.windowId, url);
          }, 300);
        } else {
          console.warn('Skipping screenshot for undefined or restricted URL:', url);

        //   
        //   updateIcon(false);
        }
      }
    });
  }
});

// Function to take a screenshot
function takeScreenshot(windowId, url) {
  const domain = new URL(url).hostname;
  console.log('Taking screenshot for domain:', domain);

  chrome.tabs.captureVisibleTab(windowId, { format: 'png' }, (dataUrl) => {
    if (chrome.runtime.lastError || !dataUrl) {
      console.error('Failed to capture screenshot:', chrome.runtime.lastError ? chrome.runtime.lastError.message : 'Unknown error');
      return;
    }

    if (!screenshotCount[domain]) {
      screenshotCount[domain] = 1;
    } else {
      screenshotCount[domain]++;
    }

    const screenshotNumber = screenshotCount[domain];
    const fileName = `${screenshotNumber}--${url.replace(/[^a-z0-9]/gi, '_').substring(0, 50)}.png`;
    console.log('Generated file name for screenshot:', fileName);

    chrome.downloads.download({
      url: dataUrl,
      filename: `${domain}/${fileName}`,
      conflictAction: 'uniquify'
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error('Failed to download screenshot:', chrome.runtime.lastError.message);
      } else {
        console.log('Screenshot saved with download ID:', downloadId);
      }
    });
  });
}

// Function to update the extension icon
function updateIcon(isEnabled) {
  const iconPath = isEnabled ? './icons/32-on.png' : './icons/32-off.png';
  console.log('Updating icon to:', iconPath);
  try {
    chrome.action.setIcon({ path: iconPath }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error setting icon:', chrome.runtime.lastError.message);
      } else {
        console.log('Icon successfully updated to:', iconPath);
      }
    });
  } catch (error) {
    console.error('Exception caught while updating icon:', error.message);
  }
}

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message);
  if (message.screenshotsEnabled !== undefined) {
    console.log('Screenshot functionality has been', message.screenshotsEnabled ? 'enabled' : 'disabled');
    updateIcon(message.screenshotsEnabled);
    sendResponse({ status: "success" });
  } else if (message.action === "takeScreenshot") {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError || !dataUrl) {
        console.error('Failed to capture screenshot:', chrome.runtime.lastError ? chrome.runtime.lastError.message : 'Unknown error');
        sendResponse({ status: "error", message: "Failed to capture screenshot" });
      } else {
        const url = message.url;
        const domain = new URL(url).hostname;
        console.log('Taking manual screenshot for URL:', url);
        saveScreenshot(dataUrl, domain, url);
        sendResponse({ status: "success" });
      }
    });
    return true; // Indicates that the response is sent asynchronously
  } else if (message.action === "takeFullHeightScreenshot") {
    chrome.tabs.get(message.tabId, (tab) => {
      if (chrome.runtime.lastError || !tab || tab.url.startsWith('chrome://')) {
        console.error('Cannot inject content script into restricted URL:', tab ? tab.url : 'unknown');
        sendResponse({ status: "error", message: "Cannot inject content script into restricted URL" });
      } else {
        chrome.scripting.executeScript(
          {
            target: { tabId: message.tabId },
            files: ['content.js']
          },
          () => {
            if (chrome.runtime.lastError) {
              console.error('Failed to inject content script:', chrome.runtime.lastError.message);
              sendResponse({ status: "error", message: "Failed to inject content script" });
            } else {
              chrome.tabs.sendMessage(message.tabId, { action: "getFullHeightScreenshot" }, (response) => {
                if (chrome.runtime.lastError || !response || !response.dataUrl) {
                  console.error('Failed to capture full-height screenshot:', chrome.runtime.lastError ? chrome.runtime.lastError.message : 'Unknown error');
                  sendResponse({ status: "error", message: "Failed to capture full-height screenshot" });
                } else {
                  const url = message.url;
                  const domain = new URL(url).hostname;
                  console.log('Taking full-height screenshot for URL:', url);
                  saveScreenshot(response.dataUrl, domain, url);
                  sendResponse({ status: "success" });
                }
              });
            }
          }
        );
      }
    });
    return true; // Indicates that the response is sent asynchronously
  }
});

function saveScreenshot(dataUrl, domain, url) {
  if (!screenshotCount[domain]) {
    screenshotCount[domain] = 1;
  } else {
    screenshotCount[domain]++;
  }

  const screenshotNumber = screenshotCount[domain];
  const fileName = `${screenshotNumber}--${url.replace(/[^a-z0-9]/gi, '_').substring(0, 50)}.png`;
  console.log('Generated file name for saved screenshot:', fileName);

  chrome.downloads.download({
    url: dataUrl,
    filename: `${domain}/${fileName}`,
    conflictAction: 'uniquify'
  }, (downloadId) => {
    if (chrome.runtime.lastError) {
      console.error('Failed to download screenshot:', chrome.runtime.lastError.message);
    } else {
      console.log('Screenshot saved with download ID:', downloadId);
    }
  });
}

// Initialize the icon state when the extension starts
chrome.storage.local.get(['screenshotsEnabled'], (result) => {
  const isEnabled = result.screenshotsEnabled !== undefined ? result.screenshotsEnabled : false;
  console.log('Initializing icon state. Screenshots enabled:', isEnabled);
  updateIcon(isEnabled);
});
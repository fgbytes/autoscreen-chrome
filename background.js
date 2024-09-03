let screenshotCount = {};

// Listen for tab updates and take screenshots if enabled
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    chrome.storage.local.get(['screenshotsEnabled'], (result) => {
      if (result.screenshotsEnabled) {
        const url = tab.url;

        // Check if the URL is defined and not a restricted one
        if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
          // Add a 300ms delay before taking the screenshot
          setTimeout(() => {
            takeScreenshot(tab.windowId, url);
          }, 300);
        } else {
          console.warn('Skipping screenshot for undefined or restricted URL:', url);
        }
      }
    });
  }
});



// Function to take a screenshot
function takeScreenshot(windowId, url) {
  const domain = new URL(url).hostname;

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

// Listen for messages from popup.js
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
    if (message.screenshotsEnabled !== undefined) {
      console.log('Screenshot functionality has been', message.screenshotsEnabled ? 'enabled' : 'disabled');
      updateIcon(message.screenshotsEnabled);
      sendResponse({ status: "success" });
    }
  });
  
  // Initialize the icon state when the extension starts
  chrome.storage.local.get(['screenshotsEnabled'], (result) => {
    const isEnabled = result.screenshotsEnabled !== undefined ? result.screenshotsEnabled : false;
    updateIcon(isEnabled);
  });
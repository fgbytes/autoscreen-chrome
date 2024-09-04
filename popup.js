document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.getElementById('toggle-screenshots');
    const takeScreenshotButton = document.getElementById('take-screenshot');
    // const takeFullHeightScreenshotButton = document.getElementById('take-full-height-screenshot');



    chrome.storage.local.get(['screenshotsEnabled'], (result) => {
        if (chrome.runtime.lastError) {
            console.error('Error retrieving state:', chrome.runtime.lastError);
            toggleButton.textContent = 'Error';
        } else {
            const isEnabled = result.screenshotsEnabled !== undefined ? result.screenshotsEnabled : false;
            toggleButton.textContent = isEnabled ? 'Disable Auto Screenshots' : 'Enable Auto Screenshots';
            // toggleButton.classList.toggle('active', isEnabled);
            // isEnabled ? toggleButton.classList.add('recording') : toggleButton.classList.remove('recording');
            // console.log(isEnabled)

        }
    });

    // Add a click listener to toggle the state
    toggleButton.addEventListener('click', () => {
        chrome.storage.local.get(['screenshotsEnabled'], (result) => {
            const isEnabled = result.screenshotsEnabled !== undefined ? result.screenshotsEnabled : false;
            const newState = !isEnabled;

            // Update the state in storage
            chrome.storage.local.set({ screenshotsEnabled: newState }, () => {
                if (chrome.runtime.lastError) {
                    console.error('Error setting state:', chrome.runtime.lastError);
                } else {
                    toggleButton.textContent = newState ? 'Disable Auto Screenshots' : 'Enable Auto Screenshots';
                    toggleButton.classList.toggle('enabled', newState);

                    // Send a message to the background script to update the icon
                    chrome.runtime.sendMessage({ screenshotsEnabled: newState }, (response) => {
                        if (chrome.runtime.lastError) {
                            console.error('Error sending message:', chrome.runtime.lastError);
                        } else if (response && response.status === "success") {
                            console.log('Background script responded successfully.');
                        }
                    });
                }
            });
        });
    });

    takeScreenshotButton.addEventListener('click', () => {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            const activeTab = tabs[0];
            chrome.runtime.sendMessage({action: "takeScreenshot", tabId: activeTab.id, url: activeTab.url}, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('Error sending message:', chrome.runtime.lastError);
                    takeScreenshotButton.textContent = 'Error: ' + chrome.runtime.lastError.message;
                } else if (response && response.status === "success") {
                    console.log('Screenshot taken successfully.');
                    takeScreenshotButton.textContent = 'Screenshot Taken!';
                    // Reset button text after 2 seconds
                    setTimeout(() => {
                        takeScreenshotButton.textContent = 'Take Screenshot';
                    }, 2000);
                } else {
                    console.warn('Unexpected response:', response);
                    takeScreenshotButton.textContent = 'Unexpected Response';
                }
            });
        });
    });
    // takeFullHeightScreenshotButton.addEventListener('click', () => {
    //     chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    //         const activeTab = tabs[0];
    //         chrome.runtime.sendMessage({action: "takeFullHeightScreenshot", tabId: activeTab.id, url: activeTab.url}, (response) => {
    //             if (chrome.runtime.lastError) {
    //                 console.error('Error sending message:', chrome.runtime.lastError);
    //                 takeFullHeightScreenshotButton.textContent = 'Error: ' + chrome.runtime.lastError.message;
    //             } else if (response && response.status === "success") {
    //                 console.log('Full-height screenshot taken successfully.');
    //                 takeFullHeightScreenshotButton.textContent = 'Full-Height Screenshot Taken!';
    //                 // Reset button text after 2 seconds
    //                 setTimeout(() => {
    //                     takeFullHeightScreenshotButton.textContent = 'Take Full-Height Screenshot';
    //                 }, 2000);
    //             } else {
    //                 console.warn('Unexpected response:', response);
    //                 takeFullHeightScreenshotButton.textContent = 'Unexpected Response';
    //             }
    //         });
    //     });
    // });
    
});
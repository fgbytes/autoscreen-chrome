document.addEventListener('DOMContentLoaded', () => {
    var toggleButton = document.getElementById('toggle-screenshots');
    const takeScreenshotButton = document.getElementById('take-screenshot');
    const clearCookiesLink = document.getElementById('clear-cookies');
    const waitTimeInput = document.getElementById('wait-time');

    // const takeFullHeightScreenshotButton = document.getElementById('take-full-height-screenshot');



    chrome.storage.local.get(['screenshotsEnabled'], (result) => {
        if (chrome.runtime.lastError) {
            console.error('Error retrieving state:', chrome.runtime.lastError);
            toggleButton.textContent = 'Error';
        } else {
            const isEnabled = result.screenshotsEnabled !== undefined ? result.screenshotsEnabled : false;
            toggleButton.textContent = isEnabled ? 'Disable Auto Screenshots' : 'Enable Auto Screenshots';
            isEnabled ? toggleButton.classList.add('enabled') : toggleButton.classList.remove('enabled');
            // console.log(isEnabled)

        }
    });

    // Load saved wait time
    chrome.storage.local.get(['waitTime'], (result) => {
        const waitTime = result.waitTime !== undefined ? result.waitTime : 300;
        waitTimeInput.value = waitTime;
    });

    // Save wait time on change
    waitTimeInput.addEventListener('change', () => {
        const newWaitTime = parseInt(waitTimeInput.value, 10);
        chrome.storage.local.set({ waitTime: newWaitTime });
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
                            
                            // Take the first screenshot immediately if enabled
                            if (newState) {
                                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                                    const activeTab = tabs[0];
                                    chrome.runtime.sendMessage({ action: "takeScreenshot", tabId: activeTab.id, url: activeTab.url }, (response) => {
                                        if (chrome.runtime.lastError) {
                                            console.error('Error sending message for first screenshot:', chrome.runtime.lastError);
                                        } else if (response && response.status === "success") {
                                            console.log('First screenshot taken successfully.');
                                        }
                                    });
                                });
                            }
                        }
                    });
                }
            });
        });
    });

    takeScreenshotButton.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];
            chrome.runtime.sendMessage({ action: "takeScreenshot", tabId: activeTab.id, url: activeTab.url }, (response) => {
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

    clearCookiesLink.addEventListener('click', (event) => {
        event.preventDefault();
        console.log("clear cookies");
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length === 0) {
                console.error('No active tab found.');
                return;
            }

            const activeTab = tabs[0];
            if (!activeTab.url) {
                console.error('Active tab does not have a valid URL.');
                return;
            }

            let url;
            try {
                url = new URL(activeTab.url);
            } catch (e) {
                console.error('Invalid URL:', activeTab.url);
                return;
            }

            const domain = url.hostname;
            console.log(domain);

            // Attempt to get cookies for both the domain and its subdomains
            const domainPatterns = [
                domain,
            ];

            domainPatterns.forEach((pattern) => {
                chrome.cookies.getAll({ domain: pattern }, function (cookies) {
                    console.log(`Found ${cookies.length} cookies for domain pattern: ${pattern}`);
                    for (let cookie of cookies) {
                        console.log(`Removing cookie: ${cookie.name} from ${cookie.domain}${cookie.path}`);
                        chrome.cookies.remove({
                            url: (cookie.secure ? "https://" : "http://") + cookie.domain + cookie.path,
                            name: cookie.name
                        }, (details) => {
                            if (details) {
                                console.log(`Removed cookie: ${details.name}`);
                            } else {
                                console.error(`Failed to remove cookie: ${cookie.name}`);
                            }
                        });
                    }
                });

                chrome.browsingData.remove({
                    origins: [url.origin]
                }, {
                    cookies: true,
                    localStorage: true,
                    cache: true,
                    indexedDB: true,
                    cacheStorage: true,
                    serviceWorkers: true,
                }, () => {
                    if (chrome.runtime.lastError) {
                        console.error('Error clearing cookies and site data:', chrome.runtime.lastError.message);
                    } else {
                        console.log('Cookies and site data cleared for', domain);
                        alert(`Cookies and site data cleared for ${domain}`);
                    }
                });
            });
        });
    });

    function takeScreenshot() {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];
            chrome.runtime.sendMessage({ action: "takeScreenshot", tabId: activeTab.id, url: activeTab.url }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('Error sending message:', chrome.runtime.lastError);
                } else if (response && response.status === "success") {
                    console.log('Screenshot taken successfully.');
                    takeScreenshotButton.textContent = 'Screenshot Taken!';
                    // Reset button text after 2 seconds
                    setTimeout(() => {
                        takeScreenshotButton.textContent = 'Take Screenshot';
                    }, 2000);
                } else {
                    console.warn('Unexpected response:', response);
                }
            });
        });
    }
})
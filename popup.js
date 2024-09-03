document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.getElementById('toggle-screenshots');

    // Initialize the button text
    chrome.storage.local.get(['screenshotsEnabled'], (result) => {
        if (chrome.runtime.lastError) {
            console.error('Error retrieving state:', chrome.runtime.lastError);
            toggleButton.textContent = 'Error';
        } else {
            const isEnabled = result.screenshotsEnabled !== undefined ? result.screenshotsEnabled : false;
            toggleButton.textContent = isEnabled ? 'Disable Screenshots' : 'Enable Screenshots';
        }
    });

    // Add a click listener to toggle the state
    toggleButton.addEventListener('click', () => {
        chrome.storage.local.get(['screenshotsEnabled'], (result) => {
            const isEnabled = result.screenshotsEnabled !== undefined ? result.screenshotsEnabled : false;
            const newState = !isEnabled;

            // Update the state in storage
            // Update the state in storage
            chrome.storage.local.set({ screenshotsEnabled: newState }, () => {
                if (chrome.runtime.lastError) {
                    console.error('Error setting state:', chrome.runtime.lastError);
                } else {
                    toggleButton.textContent = newState ? 'Disable Screenshots' : 'Enable Screenshots';

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
});
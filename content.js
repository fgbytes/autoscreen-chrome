chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getFullHeightScreenshot") {
        const originalScrollY = window.scrollY;
        const originalScrollX = window.scrollX;
        const originalOverflow = document.documentElement.style.overflow;

        document.documentElement.style.overflow = 'hidden';
        window.scrollTo(0, 0);

        const totalHeight = document.documentElement.scrollHeight;
        const totalWidth = document.documentElement.scrollWidth;

        chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
            window.scrollTo(originalScrollX, originalScrollY);
            document.documentElement.style.overflow = originalOverflow;
            sendResponse({ dataUrl });
        });

        return true; // Indicates that the response is sent asynchronously
    }
});
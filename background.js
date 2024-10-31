// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Mind Mapper extension installed');
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'generateMindMap') {
    // Handle any background processing if needed
    sendResponse({ success: true });
  }
});

function extractContent() {
  // Try to get the main article content
  const article = document.querySelector('article') || 
                 document.querySelector('.article') || 
                 document.querySelector('.post-content') ||
                 document.querySelector('main');
  
  if (article) {
    return article.textContent;
  }
  
  // Fallback: Use Readability algorithm to extract main content
  const clonedBody = document.body.cloneNode(true);
  
  // Remove unwanted elements
  const unwanted = clonedBody.querySelectorAll('script, style, nav, header, footer, aside');
  unwanted.forEach(elem => elem.remove());
  
  // Get paragraphs with substantial content
  const paragraphs = Array.from(clonedBody.querySelectorAll('p'))
    .filter(p => p.textContent.length > 50)
    .map(p => p.textContent)
    .join('\n');
  
  return paragraphs;
}

// This function will be called from popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractContent') {
    sendResponse({ content: extractContent() });
  }
});

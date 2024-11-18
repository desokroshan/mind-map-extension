function extractContent() {
  console.log('Extracting content');
  // Try to get the main article content
  const article = document.querySelector('article') || 
                 document.querySelector('.article') || 
                 document.querySelector('.post-content') ||
                 document.querySelector('main');
  console.log(article);
  if (article) {
    return article.textContent;
  }
  console.log('No article found');
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
  console.log(paragraphs);
  
  return paragraphs;
}

// This function will be called from popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received message:', request);
  if (request.action === 'extractContent') {
    console.log('Extracting content listener');
    sendResponse({ content: extractContent() });
  }
});

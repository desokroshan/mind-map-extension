document.addEventListener('DOMContentLoaded', function() {
  mermaid.initialize({
    startOnLoad: true,
    theme: 'default',
    securityLevel: 'loose'
  });

  document.getElementById('generateMap').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: extractContent
    }, (results) => {
      if (results && results[0]) {
        const article = results[0].result;
        generateMindMap(article);
      }
    });
  });
});

function generateMindMap(text) {
  // Simple algorithm to generate mind map structure
  const lines = text.split(/[.!?]+/).filter(line => line.trim().length > 0);
  const mainTopic = lines[0].trim();
  
  let mindMapText = 'mindmap\n';
  mindMapText += `  root((${sanitizeText(mainTopic)}))\n`;
  
  // Process subsequent lines as subtopics
  for (let i = 1; i < Math.min(lines.length, 10); i++) {
    const line = lines[i].trim();
    if (line.length > 10) {
      mindMapText += `    (${sanitizeText(line)})\n`;
    }
  }
  
  const mindmapDiv = document.getElementById('mindmap');
  mindmapDiv.innerHTML = `<div class="mermaid">${mindMapText}</div>`;
  mermaid.init(undefined, '.mermaid');
}

function sanitizeText(text) {
  // Limit length and remove special characters
  return text
    .substring(0, 50)
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .trim();
}

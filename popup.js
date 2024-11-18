document.addEventListener('DOMContentLoaded', function() {
  const generateButton = document.getElementById('generateMap');
  const statusDiv = document.getElementById('status');
  const mindmapDiv = document.getElementById('mindmap');

  // Initialize mermaid
  mermaid.initialize({
    startOnLoad: true,
    theme: 'default',
    securityLevel: 'loose'
  });

  function updateStatus(message) {
    console.log('Status:', message);
    if (statusDiv) statusDiv.textContent = message;
  }

  function showError(message, details = '') {
    console.error('Error:', message, details);
    if (mindmapDiv) {
      mindmapDiv.innerHTML = `
        <div class="error">
          Error: ${message}
          ${details ? `<br><small>${details}</small>` : ''}
        </div>`;
    }
    updateStatus('Failed to generate mind map');
  }

  generateButton.addEventListener('click', async () => {
    try {
      updateStatus('Getting page content...');
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab) {
        throw new Error('No active tab found');
      }

      // Execute content extraction script with debugging
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: function() {
          const logs = [];
          function log(...args) {
            logs.push(['log', ...args]);
          }
          function error(...args) {
            logs.push(['error', ...args]);
          }

          try {
            log('Starting content extraction');

            // Try different selectors to find the main content
            const selectors = [
              'article',
              'main',
              '[role="main"]',
              '#main-content',
              '.main-content',
              '.content',
              '.article-content',
              '.post-content'
            ];

            log('Trying selectors:', selectors);

            let content = '';
            
            // Method 1: Try main content selectors
            for (const selector of selectors) {
              const element = document.querySelector(selector);
              if (element) {
                log('Found element with selector:', selector);
                content = element.innerText;
                if (content.length > 100) {
                  log('Found content with length:', content.length);
                  break;
                }
              }
            }

            // Method 2: Try paragraphs if no content found
            if (content.length < 100) {
              log('No content found with selectors, trying paragraphs');
              const paragraphs = Array.from(document.getElementsByTagName('p'))
                .filter(p => {
                  const style = window.getComputedStyle(p);
                  return style.display !== 'none' && 
                         style.visibility !== 'hidden' && 
                         p.offsetParent !== null;
                })
                .map(p => p.innerText.trim())
                .filter(text => text.length > 0);

              log('Found paragraphs:', paragraphs.length);
              content = paragraphs.join(' ');
            }

            // Method 3: Fallback to body text
            if (content.length < 100) {
              log('Trying body text as fallback');
              content = document.body.innerText;
            }

            log('Final content length:', content.length);

            if (!content || content.length < 50) {
              throw new Error('No substantial content found');
            }

            // Clean the content
            content = content
              .replace(/[\r\n]+/g, ' ')    // Replace newlines with spaces
              .replace(/\s+/g, ' ')       // Normalize spaces
              .trim();

            log('Content cleaned, final length:', content.length);

            return {
              success: true,
              content: content,
              length: content.length,
              logs: logs
            };

          } catch (error) {
            error('Content extraction failed:', error.message);
            return {
              success: false,
              error: error.message,
              logs: logs
            };
          }
        }
      });

      // Handle extraction results
      if (!results || !results[0]) {
        throw new Error('Script execution failed');
      }

      const result = results[0].result;
      
      // Display logs from content script
      console.group('Content Script Logs');
      result.logs.forEach(([type, ...args]) => {
        if (type === 'error') {
          console.error(...args);
        } else {
          console.log(...args);
        }
      });
      console.groupEnd();

      if (!result.success) {
        throw new Error(`Content extraction failed: ${result.error}`);
      }

      if (!result.content) {
        throw new Error('No content extracted');
      }

      updateStatus(`Processing content (${result.length} characters)...`);
      await generateMindMap(result.content);
      
    } catch (error) {
      showError('Content extraction failed', error.message);
    }
  });

  async function generateMindMap(text) {
    try {
      console.log('Generating mind map from text:', text.substring(0, 100) + '...');
      
      // Split into sentences and clean
      const sentences = text
        .split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => {
          if (s.length < 10 || s.length > 100) return false;
          const words = s.split(/\s+/);
          return words.length >= 3 && words.length <= 20;
        });

      console.log('Found sentences:', sentences.length);

      if (sentences.length === 0) {
        throw new Error('No suitable sentences found in the content');
      }

      updateStatus(`Found ${sentences.length} suitable sentences...`);

      let mindMapText = 'mindmap\n';
      
      // Root node - use the first good sentence
      const root = cleanText(sentences[0]);
      mindMapText += `  root((${root}))\n`;
      
      // Add up to 5 branches
      sentences.slice(1, 6).forEach((sentence, index) => {
        const cleanSentence = cleanText(sentence);
        if (cleanSentence) {
          mindMapText += `    (${cleanSentence})\n`;
        }
      });

      console.log('Generated mind map text:', mindMapText);

      // Render mind map
      if (mindmapDiv) {
        mindmapDiv.innerHTML = `<div class="mermaid">${mindMapText}</div>`;
        await mermaid.init(undefined, '.mermaid');
        updateStatus('Mind map generated successfully!');
      }
      
    } catch (error) {
      showError('Failed to generate mind map', error.message);
    }
  }

  function cleanText(text) {
    return text
      .substring(0, 50)
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
});
// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request);
  try {
    if (request.action === 'getPRContext') {
      // Check if we're on a valid PR page
      const isValidPRPage = window.location.hostname === 'github.com'

      if (!isValidPRPage) {
        sendResponse({ error: 'Not on a supported PR page' });
        return true;
      }

      // Use async extraction to wait for dynamic content
      extractPRContextAsync().then(context => {
        console.log('Extracted context:', context);
        console.log('Current URL:', window.location.href);
        const isPRCreationPage = window.location.pathname.includes('/pull/new') || window.location.pathname.includes('/compare/');
        const isExistingPRPage = window.location.pathname.includes('/pull/') && !window.location.pathname.includes('/pull/new');

        console.log('Page elements found:', {
          pageType: isPRCreationPage ? 'PR Creation' : isExistingPRPage ? 'Existing PR' : 'Other',
          titleInput: !!document.querySelector('input[name="pull_request[title]"]'),
          titleElement: !!document.querySelector('.gh-header-title .js-issue-title'),
          branchElements: document.querySelectorAll('.branch-name, .head-ref, .base-ref').length,
          commitMessages: document.querySelectorAll('.commit-message a, .commit-title a, .commit-message').length,
          fileElements: document.querySelectorAll('.file-info a, .file a, .js-file').length,
          fileRows: document.querySelectorAll('.file.js-file, .js-file').length,
          diffElements: document.querySelectorAll('.blob-code-addition, .blob-code-deletion').length
        });
        sendResponse({ context });
      });

      return true; // Keep the message channel open for async response
    } else if (request.action === 'fillDescription') {
      console.log('Received fillDescription request with description:', request.description ? request.description.substring(0, 100) + '...' : 'none');

      if (!request.description) {
        sendResponse({ error: 'No description provided' });
        return true;
      }

      const success = fillPRDescription(request.description);
      console.log('fillPRDescription result:', success);
      if (success) {
        sendResponse({ success: true });
      } else {
        sendResponse({ error: 'Failed to fill description. Please check if you are on a supported PR page.' });
      }
    } else if (request.action === 'getCurrentPRTemplate') {
      // Return the current PR body text as a template (if any)
      const textarea = document.querySelector('textarea[name="pull_request[body]"], textarea#pull_request_body, .js-comment-field');
      const prose = document.querySelector('.ProseMirror');
      let text = '';
      if (textarea && textarea.value && textarea.value.trim().length > 0) {
        text = textarea.value;
      } else if (prose && prose.textContent && prose.textContent.trim().length > 0) {
        text = prose.textContent;
      }
      sendResponse({ template: text });
    } else if (request.action === 'logToConsole') {
      console.log('POPUP LOG:', request.message);
      sendResponse({ success: true });
    } else {
      sendResponse({ error: 'Unknown action' });
    }
  } catch (error) {
    console.error('Content script error:', error);
    sendResponse({ error: 'Internal error occurred' });
  }
  return true;
});

async function extractPRContextAsync() {
  const context = {
    title: '',
    branch: '',
    commits: [],
    files: [],
    diff: '',
    changes: {
      added: [],
      modified: [],
      deleted: [],
      totalLines: 0
    }
  };

  // Utility: wait for a minimum number of elements to appear
  async function waitForElements(selectors, minCount = 1, timeoutMs = 2000) {
    const start = Date.now();
    const getCount = () => selectors.reduce((acc, sel) => acc + document.querySelectorAll(sel).length, 0);
    if (getCount() >= minCount) return;
    return new Promise(resolve => {
      const observer = new MutationObserver(() => {
        if (getCount() >= minCount) {
          observer.disconnect();
          resolve();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => {
        observer.disconnect();
        resolve();
      }, timeoutMs);
    });
  }

  // GitHub specific selectors
  if (window.location.hostname === 'github.com') {
    // Check if we're on a PR creation page or existing PR page
    const isPRCreationPage = window.location.pathname.includes('/pull/new') || window.location.pathname.includes('/compare/');
    const isExistingPRPage = window.location.pathname.includes('/pull/') && !window.location.pathname.includes('/pull/new');

    if (isPRCreationPage) {
      // PR Creation Page
      const titleInput = document.querySelector('input[name="pull_request[title]"]');
      if (titleInput) {
        context.title = titleInput.value;
      }

      // Try multiple ways to get base/head branches on compare/new PR page
      let branchText = '';
      const branchElements = document.querySelectorAll('.branch-name');
      if (branchElements.length >= 2) {
        branchText = `${branchElements[0].textContent} → ${branchElements[1].textContent}`;
      } else {
        const headRef = document.querySelector('.head-ref');
        const baseRef = document.querySelector('.base-ref');
        if (headRef && baseRef) {
          branchText = `${headRef.textContent.trim()} → ${baseRef.textContent.trim()}`;
        } else {
          const headInput = document.querySelector('input#head_ref');
          const baseInput = document.querySelector('input#base_ref');
          if (headInput && baseInput) {
            branchText = `${headInput.value} → ${baseInput.value}`;
          }
          // Fallback: infer from URL last segment if present
          if (!branchText && window.location.pathname.includes('/compare/')) {
            const parts = window.location.pathname.split('/');
            const last = parts[parts.length - 1];
            if (last) branchText = `${last}`;
          }
        }
      }
      if (branchText) {
        context.branch = branchText;
      }
      // Try to collect commit-like info if available on compare page
      const commitMessages = document.querySelectorAll(
        '.commit-message, .commit-title, .js-commit-title, .commit-message-link, .markdown-title'
      );
      commitMessages.forEach(msg => {
        const text = msg.textContent.trim();
        if (text && !context.commits.includes(text)) context.commits.push(text);
      });

      // Wait briefly for files to load on dynamic compare pages
      await waitForElements(['.file-info a', '.file .file-info a', '.file-header .file-info a', '.file-header a', '.file .file-header a'], 2, 2000);

      const fileSelectors = ['.file-info a', '.file .file-info a', '.file-header .file-info a', '.file-header a', '.file .file-header a'];
      const seen = new Set();
      fileSelectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(file => {
          const fileName = file.textContent.trim();
          if (!fileName || seen.has(fileName)) return;
          seen.add(fileName);
          context.files.push(fileName);
          const fileContainer = file.closest('.file, .js-file, .file.js-file');
          if (fileContainer) {
            const statusElement = fileContainer.querySelector('.file-info .status, .file-status, .status-badge');
            if (statusElement) {
              const status = statusElement.textContent.trim().toLowerCase();
              if (status.includes('added') || status.includes('+') || status.includes('new')) {
                context.changes.added.push(fileName);
              } else if (status.includes('modified') || status.includes('~') || status.includes('changed')) {
                context.changes.modified.push(fileName);
              } else if (status.includes('deleted') || status.includes('-') || status.includes('removed')) {
                context.changes.deleted.push(fileName);
              }
            }
          }
        });
      });
    } else if (isExistingPRPage) {
      // Existing PR Page
      const titleElement = document.querySelector('.gh-header-title .js-issue-title');
      if (titleElement) {
        context.title = titleElement.textContent.trim();
      }

      const branchElements = document.querySelectorAll('.head-ref, .base-ref');
      if (branchElements.length >= 2) {
        context.branch = `${branchElements[0].textContent.trim()} → ${branchElements[1].textContent.trim()}`;
      }

      // Wait a bit for dynamic content to load
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check which tab we're currently on and try to extract data accordingly
      const currentTab = document.querySelector('.tabnav-tab.selected');
      console.log('Current tab:', currentTab ? currentTab.textContent.trim() : 'unknown');

      // Try to extract data from the current page state
      // This will work regardless of which tab we're on

      // Try to get commit count from the header
      const commitCountElement = document.querySelector('.commits a, .commit-count');
      if (commitCountElement) {
        console.log('Found commit count element:', commitCountElement.textContent.trim());
      }

      // Try to get file count from the header
      const fileCountElement = document.querySelector('.files a, .file-count');
      if (fileCountElement) {
        console.log('Found file count element:', fileCountElement.textContent.trim());
      }

      // Try multiple selectors for commit messages (works on any tab)
      const commitSelectors = [
        '.commit-message a',
        '.commit-title a',
        '.commit-message',
        '.js-commit-message',
        '[data-testid="commit-message"]',
        '.commit .commit-message',
        '.commit-title',
        '.commit .message',
        '.js-commit-title',
        '.commit-message-link'
      ];

      for (const selector of commitSelectors) {
        const commitElements = document.querySelectorAll(selector);
        console.log(`Trying commit selector "${selector}": found ${commitElements.length} elements`);
        if (commitElements.length > 0) {
          commitElements.forEach(commit => {
            const commitText = commit.textContent.trim();
            if (commitText && commitText.length > 5 && !context.commits.includes(commitText)) {
              context.commits.push(commitText);
              console.log('Found commit:', commitText);
            }
          });
          break; // Use the first selector that finds elements
        }
      }

      // Try multiple selectors for files (works on any tab)
      const fileSelectors = [
        '.file-info a',
        '.file a',
        '.js-file a',
        '[data-testid="file-name"]',
        '.file-info .file-name',
        '.file-name a',
        '.file-header a',
        '.file-info .file-name a',
        '.js-file .file-name',
        '.file .file-name a'
      ];

      for (const selector of fileSelectors) {
        const fileElements = document.querySelectorAll(selector);
        console.log(`Trying file selector "${selector}": found ${fileElements.length} elements`);
        if (fileElements.length > 0) {
          fileElements.forEach(file => {
            const fileName = file.textContent.trim();
            if (fileName && fileName.length > 1 && !context.files.includes(fileName)) {
              context.files.push(fileName);
              console.log('Found file:', fileName);
            }
          });
          break; // Use the first selector that finds elements
        }
      }

      // Get file change status with multiple selectors
      const fileRowSelectors = [
        '.file.js-file',
        '.js-file',
        '[data-testid="file-row"]'
      ];

      for (const rowSelector of fileRowSelectors) {
        const fileRows = document.querySelectorAll(rowSelector);
        if (fileRows.length > 0) {
          fileRows.forEach(row => {
            const fileNameElement = row.querySelector('.file-info a, .file a, .file-name');
            if (fileNameElement) {
              const fileName = fileNameElement.textContent.trim();
              const statusSelectors = [
                '.file-info .status',
                '.file-status',
                '.status-badge',
                '[data-testid="file-status"]'
              ];

              for (const statusSelector of statusSelectors) {
                const statusElement = row.querySelector(statusSelector);
                if (statusElement) {
                  const status = statusElement.textContent.trim().toLowerCase();
                  if (status.includes('added') || status.includes('+') || status.includes('new')) {
                    if (!context.changes.added.includes(fileName)) {
                      context.changes.added.push(fileName);
                    }
                  } else if (status.includes('modified') || status.includes('~') || status.includes('changed')) {
                    if (!context.changes.modified.includes(fileName)) {
                      context.changes.modified.push(fileName);
                    }
                  } else if (status.includes('deleted') || status.includes('-') || status.includes('removed')) {
                    if (!context.changes.deleted.includes(fileName)) {
                      context.changes.deleted.push(fileName);
                    }
                  }
                  break; // Use the first status element found
                }
              }
            }
          });
          break; // Use the first row selector that finds elements
        }
      }
    }

    // Extract diff information (works on both pages)
    const diffElements = document.querySelectorAll('.blob-code-addition, .blob-code-deletion');
    let addedLines = 0;
    let deletedLines = 0;

    diffElements.forEach(element => {
      if (element.classList.contains('blob-code-addition')) {
        addedLines++;
      } else if (element.classList.contains('blob-code-deletion')) {
        deletedLines++;
      }
    });

    context.changes.totalLines = addedLines + deletedLines;

    // Try to get more detailed diff content
    const diffContent = document.querySelector('.diff-view, .diff-table');
    if (diffContent) {
      context.diff = diffContent.textContent.substring(0, 2000);
    }
  }

  return context;
}

function fillPRDescription(description) {
  console.log('fillPRDescription called with description length:', description.length);
  let success = false;

  // GitHub
  if (window.location.hostname === 'github.com') {
    // Try multiple GitHub selectors for PR body
    const selectors = [
      'textarea[name="pull_request[body]"]',
      'textarea#pull_request_body',
      'form.js-new-pr-form textarea',
      'form.js-issue-update textarea',
      'markdown-toolbar + textarea',
      '.comment-form-textarea textarea',
      '.js-comment-field',
    ];
    let descriptionTextarea = null;
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) { descriptionTextarea = el; break; }
    }
    console.log('Found description textarea:', !!descriptionTextarea);
    if (descriptionTextarea) {
      console.log('Setting textarea value to:', description.substring(0, 100) + '...');
      descriptionTextarea.value = description;
      descriptionTextarea.dispatchEvent(new Event('input', { bubbles: true }));
      success = true;
      console.log('Successfully filled description');
    } else {
      // Fallback: GitHub markdown ProseMirror editor
      const proseMirror = document.querySelector('.ProseMirror');
      if (proseMirror) {
        proseMirror.focus();
        // Replace content via clipboard API as a fallback
        try {
          const dt = new DataTransfer();
          dt.setData('text/plain', description);
          const pasteEvent = new ClipboardEvent('paste', { clipboardData: dt, bubbles: true });
          proseMirror.dispatchEvent(pasteEvent);
          success = true;
          console.log('Filled description via ProseMirror paste');
        } catch (e) {
          console.warn('ProseMirror paste fallback failed:', e);
        }
      }
    }
  }

  return success;
}

// Inject an inline toolbar button and template selector near PR description editor on GitHub
(function initToolbarInjection() {
  if (window.location.hostname !== 'github.com') return;
  const injectedId = 'pr-autofill-toolbar-container';

  function alreadyInjected() {
    return document.getElementById(injectedId);
  }

  async function injectOnce() {
    if (alreadyInjected()) return;
    // Find the markdown toolbar for the PR description
    const toolbar = document.querySelector('markdown-toolbar[for="pull_request_body"], markdown-toolbar');
    if (!toolbar) return;

    const container = document.createElement('div');
    container.id = injectedId;
    container.classList.add('ActionBar-item');
    container.style.display = 'inline-flex';
    container.style.alignItems = 'center';
    container.style.gap = '6px';
    container.style.margin = '0';

    // Helpers to render icons
    const getAiIconSvg = () => `
       <svg viewBox="0 0 112 112" xmlns="http://www.w3.org/2000/svg" width="30">
  <g>
    <path d="M40.8625 83.8221L33.6079 77.7332H84.4745L40.8625 83.8221Z" fill="white"></path>
    <path d="M49.1215 73.1702V59.6886H54.9651L65.0801 73.1702H75.4252L63.2013 56.9049C67.0126 54.1672 69.5126 49.727 69.5126 44.6886C69.5126 36.4141 62.7872 29.6963 54.5126 29.6963H40.8623V73.1702H49.1215ZM49.1215 37.9478H54.5126C58.2243 37.9478 61.2534 40.9693 61.2534 44.681C61.2534 48.4079 58.2166 51.4218 54.5126 51.4218H49.1215V37.9478Z" fill="white"></path>
  </g>
  <g transform="translate(80,5) scale(1.5)">
    <path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5L6 0Z" fill="white"></path>
  </g>
  <g transform="translate(95,20) scale(1.2)">
    <path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5L6 0Z" fill="white"></path>
  </g>
  <g transform="translate(70,20) scale(1)">
    <path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5L6 0Z" fill="white"></path>
  </g>
</svg>
      `;
    const getSpinnerSvg = () => `
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 50 50" style="vertical-align: text-bottom;">
          <circle cx="25" cy="25" r="20" stroke="currentColor" stroke-width="5" fill="none" stroke-linecap="round" stroke-dasharray="31.415 31.415">
            <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.9s" repeatCount="indefinite" />
          </circle>
        </svg>
      `;

    const btn = document.createElement('button');
    btn.id = 'pr-autofill-generate-btn';
    btn.className = 'Button Button--iconOnly Button--invisible Button--medium';
    btn.type = 'button';
    btn.title = 'Autofill PR description';
    // Icon-only button with provided Gemini-like AI icon
    btn.innerHTML = getAiIconSvg();

    const select = document.createElement('select');
    select.id = 'pr-autofill-template-select';
    select.style.padding = '2px 6px';
    select.style.fontSize = '12px';
    select.className = "FormControl-input"

    const status = document.createElement('span');
    status.id = 'pr-autofill-status';
    status.style.fontSize = '12px';
    status.style.color = '#d1242f';
    status.style.marginLeft = '4px';
    status.style.display = 'none';
    status.style.whiteSpace = 'nowrap';

    // Prefer GitHub's action bar item container if present
    const actionBar = toolbar.querySelector('action-bar') || toolbar.closest('action-bar');
    const itemContainer = (actionBar && actionBar.querySelector('[data-target="action-bar.itemContainer"]'))
      || toolbar.querySelector('[data-target="action-bar.itemContainer"]')
      || toolbar;
    // Insert as first item
    itemContainer.insertBefore(container, itemContainer.firstChild || null);
    container.appendChild(select);
    container.appendChild(btn);
    container.appendChild(status);

    // Load template and last selection
    try {
      const { templates = [] } = await chrome.storage.sync.get(['templates']);
      select.innerHTML = '';
      if (templates.length === 0) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'No templates';
        select.appendChild(opt);
        btn.disabled = true;
      } else {
        templates.forEach(s => {
          const opt = document.createElement('option');
          opt.value = s.id;
          opt.textContent = s.name;
          select.appendChild(opt);
        });
        const { lastTemplate } = await chrome.storage.local.get('lastTemplate');
        if (lastTemplate && templates.some(s => s.id === lastTemplate)) {
          select.value = lastTemplate;
        } else {
          select.value = templates[0].id;
        }
        select.addEventListener('change', () => {
          chrome.storage.local.set({ lastTemplate: select.value });
        });
      }
    } catch (e) {
      // If storage fails, keep controls but disable button
      btn.disabled = true;
    }

    function showStatus(msg, ok = true) {
      // Only show messages for errors
      if (ok) return;
      status.textContent = msg;
      status.style.display = 'inline';
      setTimeout(() => { status.style.display = 'none'; }, 5000);
    }

    btn.addEventListener('click', async () => {
      if (!select.value) {
        showStatus('Select a template', false);
        return;
      }
      btn.disabled = true;
      const prevTitle = btn.title;
      const prevOpacity = btn.style.opacity;
      const prevIcon = btn.innerHTML;
      btn.title = 'Generating…';
      btn.style.opacity = '0.6';
      btn.innerHTML = getSpinnerSvg();
      try {
        const context = await extractPRContextAsync();
        const response = await new Promise(resolve => {
          chrome.runtime.sendMessage({ action: 'generatePRDescription', templateId: select.value, context }, resolve);
        });
        if (!response || response.error) {
          showStatus(response?.error || 'Generation failed', false);
        } else {
          const ok = fillPRDescription(response.description);
          if (!ok) showStatus('Fill failed', false);
        }
      } catch (err) {
        showStatus('Error: ' + (err?.message || 'unknown'), false);
      } finally {
        btn.disabled = false;
        btn.title = prevTitle;
        btn.style.opacity = prevOpacity || '';
        btn.innerHTML = prevIcon || getAiIconSvg();
      }
    });
  }

  // Try now and observe DOM changes for SPA navigations
  injectOnce();
  const obs = new MutationObserver(() => {
    injectOnce();
  });
  obs.observe(document.documentElement, { childList: true, subtree: true });
})();


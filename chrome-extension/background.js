// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('PR Autofiller Extension installed');
  console.log('Extension is working - background script loaded');

  // Set default settings if not exists
  chrome.storage.sync.get(['templates'], (data) => {
    if (!data.templates) {
      const defaultTemplates = [
        {
          id: 'default',
          name: 'Default Template',
          template: `## Summary
{{summary}}

## What changed?
{{commits}}

## Files Changed
{{files}}

## How to test?
1. Step 1
2. Step 2

## Checklist
- [ ] Code reviewed
- [ ] Tests added
- [ ] Documentation updated`
        }
      ];
      chrome.storage.sync.set({ templates: defaultTemplates });
    }
  });
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    if (request.action === 'getTemplates') {
      chrome.storage.sync.get(['templates'], (data) => {
        if (chrome.runtime.lastError) {
          console.error('Storage error:', chrome.runtime.lastError);
          sendResponse({ error: 'Failed to load templates' });
        } else {
          sendResponse(data.templates || []);
        }
      });
      return true;
    } else if (request.action === 'generatePRDescription') {
      // Generate description in background
      (async () => {
        try {
          const { templateId, context } = request;
          const { templates = [], apiKey } = await chrome.storage.sync.get(['templates', 'apiKey']);

          // Resolve selected template object
          const selectedTemplate = (templates.find(t => t.id === templateId)) || templates[0];
          if (!selectedTemplate) {
            sendResponse({ error: 'No template configured' });
            return;
          }
          const resolvedTemplateText = selectedTemplate.template || '';
          if (!context || typeof context !== 'object') {
            sendResponse({ error: 'Invalid PR context' });
            return;
          }
          if (!apiKey) {
            sendResponse({ error: 'API key not configured' });
            return;
          }
          if (!apiKey.startsWith('sk-')) {
            sendResponse({ error: 'Invalid API key format' });
            return;
          }
          // Build dynamic rules: prefer user-defined rules in template; fallback to defaults
          const baseGuardrails = [
            'You fill an existing PR description template exactly, using only the supplied context.',
            'Hard rules:',
            '- Do not add or remove sections, headings, quotes, or guidance text outside of placeholders.',
            '- Preserve formatting and whitespace exactly (including indentation and bullet style).',
            '- Never echo the context, add commentary, or wrap output in code fences.',
            '',
          ].join('\n');
          const defaultRuleSet = [
            'Filling rules:',
            '- If the template contains Handlebars placeholders (e.g., {{summary}}, {{commits}}, {{files}}, {{title}}, {{branch}}, {{addedFiles}}, {{modifiedFiles}}, {{deletedFiles}}, {{totalLines}}), replace only those with context-derived values.',
            '- If there are no {{..}} placeholders:',
            '  • Replace obvious tokens: JIRA-XXXX, guidance like "Describe in 1-3 sentences", and lines that say [MANDATORY: please fill out].',
            '  • Key Decisions section: fill with 1–3 concise bullets that explain the rationale for the change, derived from the PR purpose (title without ticket) and top commit messages. Do NOT include file names or paths.',
            '  • Key Classes section: fill with class names only (base filenames) from the changed files list; no paths, no parentheses. Keep the existing bullet indentation and style. Limit to 1–5 items.',
            '  • Keep sections like Screenshots/Recordings instructions unchanged if they are not placeholders.',
            '  • Keep the first paragraph (CREATE A DRAFT PR IF YOU\'RE NOT READY TO UNDERGO REVIEW) unchanged if it\'s not a placeholder.',
            '',
            'Output only the final filled template.'
          ].join('\n');
          const userRules = (selectedTemplate && typeof selectedTemplate.rules === 'string' && selectedTemplate.rules.trim().length)
            ? selectedTemplate.rules.trim()
            : defaultRuleSet;

          const systemContent = baseGuardrails + userRules;

          const body = {
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: systemContent
              },
              {
                role: 'user',
                content: [
                  'Template:\n' + (resolvedTemplateText || ''),
                  '',
                  'Context (JSON):',
                  JSON.stringify({
                    title: context.title,
                    branch: context.branch,
                    commits: context.commits,
                    files: context.files,
                    changes: context.changes
                  }, null, 2),
                  '',
                  'Task: Fill the template strictly following the rules above.'
                ].join('\n')
              }
            ],
            temperature: 0.5,
            max_tokens: 900
          };
          const resp = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(body)
          });
          if (!resp.ok) {
            const err = await resp.json().catch(() => ({}));
            sendResponse({ error: `API Error: ${resp.status} - ${err.error?.message || 'Unknown error'}` });
            return;
          }
          const data = await resp.json();
          const content = data?.choices?.[0]?.message?.content;
          if (!content) {
            sendResponse({ error: 'Invalid response from AI API' });
            return;
          }
          sendResponse({ description: content });
        } catch (e) {
          console.error('generatePRDescription error:', e);
          sendResponse({ error: e?.message || 'Internal error' });
        }
      })();
      return true;
    }
  } catch (error) {
    console.error('Message handler error:', error);
    sendResponse({ error: 'Internal error occurred' });
  }
});


// Handle extension icon click
chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});

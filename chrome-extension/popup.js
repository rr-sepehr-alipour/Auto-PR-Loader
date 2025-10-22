window.popupLoaded = true;

document.addEventListener('DOMContentLoaded', async () => {

  const templateSelect = document.getElementById('templateSelect');
  const generateBtn = document.getElementById('generateBtn');
  const autofillBtn = document.getElementById('autofillBtn');
  const statusDiv = document.getElementById('status');
  const openOptionsLink = document.getElementById('openOptions');
  let loadedTemplates = [];

  // Show minimal UI, no initial status toast

  // Initially disable autofill button
  autofillBtn.disabled = true;
  autofillBtn.style.opacity = '0.5';

  // Remove debug test button behavior (no alerts/log piping)

  // Load templates and check API key
  try {
    const { templates = [], apiKey } = await chrome.storage.sync.get(['templates', 'apiKey']);
    loadedTemplates = templates;

    // Gate generate button based on API key or free mode
    if (!apiKey) {
      showStatus('⚠️ Please configure your OpenAI API key in settings', 'error');
      generateBtn.disabled = true;
      generateBtn.textContent = 'Configure API Key First';
    } else {
      generateBtn.disabled = false;
      generateBtn.textContent = 'Generate PR Description';
    }

    if (templates.length === 0) {
      templateSelect.innerHTML = '<option value="">No templates configured</option>';
      showStatus('Please configure templates in settings', 'info');
    } else {
      // Clear the default option
      templateSelect.innerHTML = '';

      templates.forEach(template => {
        const option = document.createElement('option');
        option.value = template.id;
        option.textContent = template.name;
        templateSelect.appendChild(option);
      });

      // Auto-select the first template if available
      if (templates.length > 0) {
        templateSelect.value = templates[0].id;
        showStatus(`Loaded ${templates.length} template(s). Selected: ${templates[0].name}`, 'success');
      }
    }
  } catch (error) {
    console.error('Error loading settings:', error);
    templateSelect.innerHTML = '<option value="">Error loading settings</option>';
    showStatus('Error loading settings', 'error');
  }

  // Load last selected template
  const { lastTemplate } = await chrome.storage.local.get('lastTemplate');
  if (lastTemplate) {
    templateSelect.value = lastTemplate;
  }

  // Save selected template
  templateSelect.addEventListener('change', () => {
    chrome.storage.local.set({ lastTemplate: templateSelect.value });
  });

  // Generate PR description
  generateBtn.addEventListener('click', async () => {

    const templateId = templateSelect.value;
    if (!templateId) {
      showStatus('Please select a template', 'error');
      return;
    }

    // Show loading state
    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating...';
    showStatus('Generating description...', 'info');

    try {
      // Get the current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab) {
        throw new Error('No active tab found');
      }

      // Send message to content script to get PR context
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'getPRContext'
      });
      if (!response || response.error) {
        throw new Error(response?.error || 'Failed to get PR context');
      }
      // Generate description using AI or free mode
      const description = await generatePRDescription(templateId, response.context, tab.id);
      // Store the generated description
      await chrome.storage.local.set({ generatedDescription: description });

      // Enable autofill button
      autofillBtn.disabled = false;
      autofillBtn.style.opacity = '1';

      showStatus('Description generated! Click "Autofill" to apply.', 'success');
    } catch (error) {
      console.error('Generation error:', error);
      showStatus('Error: ' + error.message, 'error');
    } finally {
      // Hide loading state
      generateBtn.disabled = false;
      generateBtn.textContent = 'Generate PR Description';
    }
  });

  // Autofill PR description
  autofillBtn.addEventListener('click', async () => {
    try {
      const { generatedDescription } = await chrome.storage.local.get('generatedDescription');

      if (!generatedDescription) {
        showStatus('Please generate a description first', 'error');
        return;
      }

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab) {
        throw new Error('No active tab found');
      }

      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'fillDescription',
        description: generatedDescription
      });

      if (response && response.error) {
        throw new Error(response.error);
      }

      showStatus('Description filled successfully!', 'success');
    } catch (error) {
      console.error('Autofill error:', error);
      if (error.message && error.message.includes('Could not establish connection')) {
        showStatus('Please refresh the page and try again', 'error');
      } else {
        showStatus('Error: ' + error.message, 'error');
      }
    }
  });

  // Open options page
  openOptionsLink.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 5000);
  }
});

async function generatePRDescription(templateId, context, tabId) {
  const { templates = [], apiKey } = await chrome.storage.sync.get(['templates', 'apiKey']);

  const template = templates.find(t => t.id === templateId);

  if (!template) {
    throw new Error('Template not found');
  }

  // Validate context
  if (!context || typeof context !== 'object') {
    throw new Error('Invalid PR context received');
  }

  // Use AI service (OpenAI)
  if (!apiKey) {
    throw new Error('API key not configured. Please set it in options.');
  }

  if (!apiKey.startsWith('sk-')) {
    throw new Error('Invalid API key format. Please check your OpenAI API key.');
  }

  try {
    // Call AI API (OpenAI)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You generate PR descriptions strictly by filling the provided template using the given context.\nRules:\n- Do not add or remove sections beyond what the template already contains.\n- Replace placeholders like {{summary}}, {{commits}}, {{files}}, {{title}}, {{branch}}.\n- If the template has no {{..}} placeholders, replace obvious template placeholders such as JIRA-XXXX, empty JIRA links, [MANDATORY: please fill out], and guidance text like "Describe in 1-3 sentences" with context-based values.\n- Do not include any extra commentary, code fences, or context dumps.\n- Keep formatting identical to the template, only substitute placeholder values.'
          },
          {
            role: 'user',
            content: 'Template:\n' + template.template + '\n\nContext:\n' + JSON.stringify(context, null, 2) + '\n\nTask: Fill the template strictly by replacing placeholders with values inferred from the context.'
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response from AI API');
    }

    return data.choices[0].message.content;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your internet connection.');
    }
    throw error;
  }
}
let templates = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();

  document.getElementById('addTemplateBtn').addEventListener('click', addNewTemplate);
  document.getElementById('saveBtn').addEventListener('click', saveSettings);

  // No free mode toggle

  // No template source toggle
});

// No free mode; always show API key section

async function loadSettings() {
  const data = await chrome.storage.sync.get(['templates', 'apiKey']);
  templates = (data.templates || getDefaultTemplates()).map(t => ({ ...t, rules: typeof t.rules === 'string' ? t.rules : '' }));

  if (data.apiKey) {
    document.getElementById('apiKey').value = data.apiKey;
  }

  // No free mode handling

  // No template source toggle

  renderTemplates();
}

function getDefaultTemplates() {
  return [
    {
      id: 'frontend',
      name: 'Frontend Team',
      rules: '',
      template: `## 🎯 Purpose
{{summary}}

## 📝 Changes
- {{commits}}

## 📁 Files Changed
{{files}}

## 🧪 Testing
- [ ] Unit tests passed
- [ ] E2E tests passed
- [ ] Manual testing completed

## 📸 Screenshots
[Add screenshots if applicable]

## 🔗 Related Issues
Closes #`
    },
    {
      id: 'backend',
      name: 'Backend Team',
      rules: '',
      template: `## 🔧 Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## 📋 Description
{{summary}}

## 🏗️ Implementation Details
{{commits}}

## 🧪 How Has This Been Tested?
- [ ] Unit tests
- [ ] Integration tests
- [ ] Performance tests

## 📊 Performance Impact
[Describe any performance implications]

## 🔐 Security Considerations
[Any security implications?]`
    }
  ];
}

function renderTemplates() {
  const container = document.getElementById('templatesList');
  container.innerHTML = '';

  templates.forEach((template, index) => {
    const templateDiv = document.createElement('div');
    templateDiv.className = 'template-item';
    templateDiv.innerHTML = `
      <h3>${template.name}</h3>
      <label>Template Name:</label>
      <input type="text" value="${template.name}" data-index="${index}" data-field="name">
      
      <label>Template:</label>
      <textarea data-index="${index}" data-field="template">${template.template}</textarea>

  <label>Rules (optional):</label>
  <textarea data-index="${index}" data-field="rules" placeholder="Write how the AI should fill this template.\nExamples:\n- Key Decisions: summarize purpose and top commits.\n- Key Classes: class names only, no paths, 1–5 items.">${template.rules || ''}</textarea>

      <button class="delete" data-index="${index}">Delete Template</button>
    `;
    container.appendChild(templateDiv);
  });

  // Add event listeners
  container.querySelectorAll('input, textarea').forEach(element => {
    element.addEventListener('change', (e) => {
      const index = e.target.dataset.index;
      const field = e.target.dataset.field;
      templates[index][field] = e.target.value;
    });
  });

  container.querySelectorAll('.delete').forEach(button => {
    button.addEventListener('click', (e) => {
      const index = e.target.dataset.index;
      templates.splice(index, 1);
      renderTemplates();
    });
  });
}

function addNewTemplate() {
  const newTemplate = {
    id: `template_${Date.now()}`,
    name: 'New Template',
    rules: '',
    template: `## Summary
{{summary}}

## Changes
{{commits}}

## Testing
- [ ] Tests added/updated
- [ ] All tests passing`
  };

  templates.push(newTemplate);
  renderTemplates();
}

async function saveSettings() {
  const apiKey = document.getElementById('apiKey').value.trim();
  const useFreeMode = false;
  const usePrTemplate = false;
  const statusDiv = document.getElementById('status');

  // Validate API key
  if (apiKey && !apiKey.startsWith('sk-')) {
    showStatus('API key should start with "sk-"', 'error');
    return;
  }

  // Validate templates
  for (let i = 0; i < templates.length; i++) {
    const template = templates[i];
    if (!template.name.trim()) {
      showStatus(`Template ${i + 1} must have a name`, 'error');
      return;
    }
    if (!template.template.trim()) {
      showStatus(`Template "${template.name}" must have a template`, 'error');
      return;
    }
  }

  try {
    await chrome.storage.sync.set({ templates, apiKey });

    // Show success message
    const saveBtn = document.getElementById('saveBtn');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = '✓ Saved!';
    saveBtn.style.background = '#28a745';

    showStatus('Settings saved successfully!', 'success');

    setTimeout(() => {
      saveBtn.textContent = originalText;
      saveBtn.style.background = '#0366d6';
    }, 2000);
  } catch (error) {
    console.error('Save error:', error);
    showStatus('Error saving settings: ' + error.message, 'error');
  }
}

function showStatus(message, type) {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.style.display = 'block';

  setTimeout(() => {
    statusDiv.style.display = 'none';
  }, 5000);
}

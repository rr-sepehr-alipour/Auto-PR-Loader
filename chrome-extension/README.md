# Chrome Extension - AI PR Description Autofiller

A Chrome extension that adds AI-powered autofill capabilities directly to GitHub's pull request creation page.

## Features

- 🤖 One-click PR description generation on GitHub
- 🎨 Clean, intuitive popup interface
- 🔧 Configurable AI provider (OpenAI)
- 📝 Support for multiple PR templates
- ⚙️ Easy settings management
- 🔒 API keys stored securely in browser storage

## Prerequisites

- Google Chrome or Chromium-based browser (Edge, Brave, etc.)
- OpenAI API key (get one from [OpenAI Platform](https://platform.openai.com/api-keys))
- Git repository with GitHub pull request templates

## Installation

### Load Unpacked Extension

1. Clone or download this repository

2. Open Chrome and navigate to:
   ```
   chrome://extensions/
   ```

3. Enable **Developer mode** (toggle in top-right corner)

4. Click **Load unpacked**

5. Select the `chrome-extension` directory from this repository

6. The extension icon should appear in your browser toolbar

### Configure API Key

1. Click the extension icon in your toolbar
2. Click **⚙️ Manage Templates**
3. Enter your OpenAI API key
4. Click **Save All Settings**

## Usage

### On GitHub PR Page

1. Navigate to GitHub and start creating a new pull request
2. Click the extension icon in your toolbar
3. Click **Autofill Current PR**
4. Extension automatically fills the PR description field
5. Review and edit as needed

### Managing Templates

1. Click **⚙️ Manage Templates** in the popup
2. Add templates by clicking **+ Add New Template**
3. For each template:
   - **Name**: Give it a descriptive name
   - **Content**: Paste your PR template markdown
4. Save your changes

## How It Works

### Content Analysis

The extension automatically detects:
- Current branch name from GitHub page
- Target branch for the PR
- Changed files in the PR
- Commit messages (if available)

### AI Processing

When you click generate:
1. Extension reads the current PR page context
2. Sends branch info, changes, and template to AI
3. AI analyzes the changes and fills the template
4. Returns formatted PR description

### Template Filling

The AI will:
- Extract JIRA ticket numbers from branch names
- Generate appropriate PR titles
- Fill template sections based on changes
- Maintain template structure and formatting
- Keep all checkboxes and sections intact

## Extension Structure

```
chrome-extension/
├── manifest.json       # Extension configuration
├── popup.html          # Extension popup UI
├── popup.js            # Popup logic
├── options.html        # Settings page UI
├── options.js          # Settings logic
├── content.js          # GitHub page interaction
├── background.js       # Background service worker
└── icons/              # Extension icons
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

## Configuration

### API Provider Settings

Edit `options.html` and `options.js` to add support for additional AI providers:

**Currently Supported:**
- OpenAI (GPT-3.5/GPT-4)
- Anthropic Claude (via API)

### Custom Template Format

Templates should follow markdown format. Common sections:

```markdown
## [JIRA-XXXX]

### Pull Request Purpose
[AI will fill this based on commits]

### Key Changes
- [AI will list changed files and purposes]

### Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass

### Checklist
- [ ] Code reviewed
- [ ] Documentation updated
```

## Permissions

The extension requires:
- `storage` - Store API keys and templates
- `activeTab` - Read current GitHub PR page
- `tabs` - Detect GitHub PR pages
- `scripting` - Inject content scripts
- `https://github.com/*` - Access GitHub pages

## Privacy & Security

- ✅ API keys stored locally in browser
- ✅ No data sent to third-party servers (except AI APIs)
- ✅ Only activates on GitHub PR pages
- ✅ Open source - review code yourself

## Troubleshooting

### Extension Icon Not Showing

1. Check extension is enabled at `chrome://extensions/`
2. Refresh the page
3. Pin the extension to toolbar:
   - Click puzzle icon in toolbar
   - Find "AI PR Description Autofiller"
   - Click pin icon

### "API Key Not Configured"

1. Click extension icon
2. Click **⚙️ Manage Templates**
3. Enter your OpenAI API key
4. Click **Save All Settings**
5. Refresh GitHub page

### Autofill Not Working

**Check these:**
- Are you on a GitHub PR creation page?
- Is your API key valid?
- Check browser console for errors (F12)
- Verify template is properly configured

**Common issues:**
- **Wrong page**: Extension only works on `github.com/*/compare/*` or PR edit pages
- **API limits**: Check you haven't exceeded OpenAI rate limits
- **Invalid key**: Generate a new API key

### Generated Content Incorrect

**Tips:**
- Use clear branch naming: `name/type/ticket-id-description`
- Add descriptive commit messages
- Ensure templates have clear section markers
- Review and edit generated content before submitting

## Customization

### Change AI Model

Edit `popup.js` or `background.js` to modify the AI model:

```javascript
// Find this section:
const model = "gpt-3.5-turbo"; // or "gpt-4"
```

### Adjust Prompt Template

Edit the system prompt in `popup.js`:

```javascript
const systemPrompt = `
You are a helpful assistant that fills PR templates.
Analyze the following git information and fill the template...
`;
```

### Styling

Modify `popup.html` or `options.html` CSS sections to customize appearance.

## Browser Compatibility

Tested on:
- ✅ Chrome 100+
- ✅ Edge 100+
- ✅ Brave 1.40+
- ✅ Opera 86+

**Not supported:**
- ❌ Firefox (uses different extension format)
- ❌ Safari (requires separate implementation)

## Known Limitations

- Only works on GitHub.com (not GitHub Enterprise)
- Requires internet connection for AI processing
- API calls count against your OpenAI usage
- Large PRs may timeout or require stronger models

## Future Enhancements

Potential improvements:
- [ ] Support for GitHub Enterprise
- [ ] Firefox/Safari versions
- [ ] Offline template suggestions
- [ ] Multiple AI provider switching
- [ ] Automatic branch name parsing improvements
- [ ] Template sharing/import/export

## Development

### Local Development

1. Make changes to extension files
2. Go to `chrome://extensions/`
3. Click refresh icon on the extension card
4. Test changes on GitHub PR pages

### Debugging

1. **Popup**: Right-click extension icon → Inspect popup
2. **Content Script**: F12 on GitHub page → Console tab
3. **Background**: Go to `chrome://extensions/` → Service Worker → Inspect

## Back to Main Documentation

[← Back to main README](../README.md)

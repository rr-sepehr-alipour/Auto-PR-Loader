# AI PR Description Autofiller

A comprehensive toolkit that leverages AI to automatically generate GitHub pull request titles and descriptions. This repository offers three different solutions to fit your workflow preferences.

## Overview

Creating well-formatted pull requests with properly filled templates can be time-consuming. These tools use AI to analyze your git changes, commits, and branch information to automatically:
- Generate descriptive PR titles following your naming conventions
- Fill PR templates with relevant information
- Extract JIRA ticket numbers from branch names or commits
- List key changed files and provide context

## Solutions

### 1. Chrome Extension
**Best for:** Users who prefer a browser-based solution with a GUI

A Chrome extension that adds an autofill button directly to GitHub's PR creation page.

**Features:**
- One-click autofill on GitHub PR pages
- Configurable AI provider (OpenAI for now)
- Visual interface with settings management
- Works entirely in the browser

[See Chrome Extension Documentation →](./chrome-extension/README.md)

### 2. Bash Script
**Best for:** Developers who prefer command-line automation

A standalone bash script that uses the Claude CLI to generate and create PRs directly from your terminal.

**Features:**
- Complete CLI workflow
- Interactive branch selection
- PR preview before creation
- No browser needed

[See Bash Script Documentation →](./bash-script/README.md)

### 3. Claude Custom Command
**Best for:** Claude Code users who want integrated AI assistance

A custom command for Claude Code that allows you to create PRs through conversational AI interaction.

**Features:**
- Natural language interaction
- Integrated into your Claude Code workflow
- Step-by-step guidance
- Direct access to Claude's analysis capabilities

[See Claude Command Documentation →](./claude-command/README.md)

## Quick Start

### Chrome Extension
```bash
cd chrome-extension
# Load unpacked extension in Chrome
# Configure API key in extension settings
```

### Bash Script
```bash
cd bash-script
chmod +x claude-auto-pr
./claude-auto-pr
```

### Claude Custom Command
```bash
# Copy command file to your Claude commands directory
cp claude-command/auto-pr.md ~/.claude/commands/
# Use in Claude Code:
/auto-pr
```

## Common Requirements

All solutions expect:
- A git repository with a PR template at `.github/PULL_REQUEST_TEMPLATE.md`
- Branch naming convention: `(dev-name)/(task|bug|etc.)/(ticket-id)-(description)`
  - Example: `sepehr/task/ebca-11743-change-copy-for-interact`
- GitHub CLI (`gh`) authenticated (for bash script and Claude command)

## Branch Naming Convention

Expected pattern: `(dev-name)/(task|bug|etc.)/(ticket-id)-(description)`

**Example Branch:** `sepehr/task/ebca-11743-change-copy-for-interact`

**Generated Title:** `EBCA-11743: change copy for interact`

The tools will:
- Extract the ticket ID and convert to uppercase
- Replace dashes with spaces in the description
- Format as: `TICKET-ID: description`

## Template Processing

All solutions automatically:
- Replace `[JIRA-XXXX]` placeholders with actual ticket numbers
- Fill "Pull Request Purpose" section based on commits and changes
- List key changed files in relevant sections
- Preserve all checkboxes and template formatting

## Comparison

| Feature | Chrome Extension | Bash Script | Claude Command |
|---------|-----------------|-------------|----------------|
| **Environment** | Browser | Terminal | Claude Code |
| **AI Provider** | OpenAI/Anthropic | Claude CLI | Claude Code |
| **Setup Complexity** | Medium | Low | Low |
| **Interaction** | GUI | Interactive CLI | Conversational |
| **PR Creation** | Manual copy-paste | Automatic | Automatic |
| **Best For** | GUI lovers | CLI enthusiasts | Claude users |

## Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest improvements
- Add support for new AI providers
- Improve documentation

## License

MIT License - feel free to use and modify for your needs.

## Acknowledgments

Built with:
- [Claude AI](https://claude.ai) by Anthropic
- [GitHub CLI](https://cli.github.com/)
- [OpenAI API](https://openai.com/api/)

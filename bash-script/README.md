# Bash Script - Claude Auto PR Creator

A bash script that uses the Claude CLI to automatically generate and create GitHub pull requests with AI-powered analysis.

## Prerequisites

- `gh` CLI tool installed and authenticated ([Installation guide](https://cli.github.com/))
- `claude` CLI tool installed and authenticated ([Installation guide](https://rakutenrewards.atlassian.net/wiki/spaces/E2/pages/43493294436/Claude+Code+Onboarding))
- Git repository with a `.github/PULL_REQUEST_TEMPLATE.md` file
- Bash shell environment

## Installation

1. Make the script executable:
```bash
chmod +x claude-auto-pr
```

2. Optionally, add to your PATH or create an alias:
```bash
# Add to ~/.bashrc or ~/.zshrc
alias auto-pr="/path/to/bash-script/claude-auto-pr"
```

## Usage

Run the script from your git repository:

```bash
./claude-auto-pr
```

### Interactive Flow

1. **Branch Detection**: Script automatically detects your current branch
2. **Target Branch Selection**:
   - View available branches
   - Choose target branch (defaults to `dev`)
3. **AI Analysis**:
   - Claude analyzes commits since target branch
   - Reviews changed files
   - Reads and fills PR template
4. **Review**:
   - See complete Claude analysis
   - Review the generated PR title and body
5. **Confirmation**:
   - Confirm to create the PR
   - PR is created automatically via `gh pr create`

## How It Works

### 1. Gathers Git Data

The script collects:
- Current branch name
- Commits since target branch
- Changed files (diff)
- Current git status

### 2. AI Processing

Sends data to Claude CLI with instructions to:
- Generate PR title from branch name pattern
- Extract JIRA ticket from branch/commits
- Fill PR template sections:
  - Replace `[JIRA-XXXX]` placeholders
  - Fill "Pull Request Purpose"
  - List key changed files in "Key Classes"
- Preserve all checkboxes and formatting

### 3. PR Creation

- Uses `gh pr create` with generated content
- Creates PR against specified target branch
- Displays PR URL upon success

## Branch Naming Convention

Expected branch pattern: `(dev-name)/(task|bug|etc.)/(ticket-id)-(description)`

**Example**: `sepehr/task/ebca-11743-change-copy-for-interact`

**Generated Title**: `EBCA-11743: change copy for interact`

## Example Output

```
🤖 Gathering git information for Claude analysis...
📍 Current branch: sepehr/task/ebca-11760-move-native-auth-packages

🌿 Available branches:
dev
main
staging

🎯 What branch should this PR target? [dev]: dev
   → Target branch: dev

📊 Getting changes since dev...
📤 Sending all data to Claude for analysis...

================================
TITLE: EBCA-11760: move native auth packages to ca
PARENT_BRANCH: dev
JIRA: EBCA-11760
TEMPLATE:
## [EBCA-11760]

### Pull Request Purpose
Refactor authentication packages by moving native auth packages...
[Template content continues...]
================================

🚀 Ready to create PR:
   gh pr create --title "EBCA-11760: move native auth packages to ca" --base "dev" --body "[AI-generated template]"

Execute this command? (y/n): y
✅ PR created successfully!
https://github.com/your-org/your-repo/pull/123
```

## Temporary Files

The script creates temporary files during execution:
- `/tmp/claude_pr_response.txt` - Claude's full analysis output
- `/tmp/pr_template.txt` - Processed PR template body

These files are automatically overwritten on each run.

## Error Handling

The script validates:
- PR title extraction from Claude response
- Parent branch specification
- Template content generation

If any component is missing:
- Reports specific errors
- Exits without creating PR
- Preserves all temporary files for debugging

## Customization

### Modify Branch Pattern

Edit line 58-64 in `claude-auto-pr` to change title generation logic:

```bash
1. Generate a PR title in this pattern:
- Title pattern: (dev name)/(task, bug, etc.)/(ticket id)-(description)
- Extract the ticket ID and description
- Convert ticket ID to uppercase
- Replace dashes with spaces in description
- Format as: TICKET-ID: description
```

### Change Template Location

Edit line 34 to change PR template path:

```bash
PR_TEMPLATE=$(cat "../.github/PULL_REQUEST_TEMPLATE.md")
```

### Adjust Default Target Branch

Change line 19 to modify default branch:

```bash
PARENT_BRANCH=${PARENT_BRANCH:-dev}  # Change 'dev' to your default
```

## Troubleshooting

### "claude: command not found"
Install Claude CLI: https://docs.anthropic.com/en/api/claude-cli

### "gh: command not found"
Install GitHub CLI: https://cli.github.com/

### "No such file: PULL_REQUEST_TEMPLATE.md"
Ensure your repository has a PR template at `.github/PULL_REQUEST_TEMPLATE.md` relative to the script location.

### PR title not extracted correctly
Check `/tmp/claude_pr_response.txt` to see Claude's raw output. The script looks for `TITLE:` in the response.

## Notes

- Script uses `set -e` for fail-fast behavior
- Requires Claude CLI available in PATH
- GitHub CLI must be authenticated with repository access
- Works with any PR template format
- Can be adapted for different branching strategies

## Back to Main Documentation

[← Back to main README](../README.md)

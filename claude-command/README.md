# Claude Custom Command - Auto PR Creator

A custom command for Claude Code that enables conversational PR creation with AI-powered analysis and template filling.

## Prerequisites

- [Claude Code](https://docs.claude.com/en/docs/claude-code) installed and configured
- `gh` CLI tool installed and authenticated ([Installation guide](https://cli.github.com/))
- Git repository with a `.github/PULL_REQUEST_TEMPLATE.md` file

## Installation

1. Copy the command file to your Claude commands directory:
```bash
cp auto-pr.md ~/.claude/commands/
```

Or manually:
```bash
mkdir -p ~/.claude/commands
cp auto-pr.md ~/.claude/commands/
```

2. Verify installation:
```bash
ls ~/.claude/commands/
# Should show: auto-pr.md
```

## Usage

### In Claude Code

1. Navigate to your git repository
2. Run the command:
```
/auto-pr
```

3. Claude will guide you through:
   - Analyzing your current branch and changes
   - Selecting a target branch
   - Generating PR title and description
   - Reviewing the PR preview
   - Creating the PR

### Example Interaction

```
You: /auto-pr

Claude: I'll help you create a GitHub pull request. Let me gather information about your current branch.

[Claude analyzes git information]

Claude: I see you're on branch `sepehr/task/ebca-11743-change-copy-for-interact`.

Available branches:
- dev
- main
- staging

What branch should this PR target? (Default: dev)

You: dev

Claude: Great! I'll target the `dev` branch. Let me analyze your changes...

[Claude reads commits, changed files, and PR template]

Claude: Here's the PR I've prepared:

**Title:** EBCA-11743: change copy for interact

**Target Branch:** dev

**Description:**
## [EBCA-11743]

### Pull Request Purpose
...

Does this look good? Should I create the PR?

You: yes

Claude: [Creates PR using gh pr create]

✅ Pull request created successfully!
https://github.com/your-org/your-repo/pull/123
```

## How It Works

### Step-by-Step Process

1. **Gather Git Information**
   - Detects current branch using `git branch --show-current`
   - Retrieves commits since parent branch
   - Lists changed files
   - Checks git status

2. **Ask for Target Branch**
   - Lists available branches
   - Prompts for target branch selection
   - Defaults to `dev` if not specified
   - Waits for user confirmation before proceeding

3. **Load PR Template**
   - Reads template from `../.github/PULL_REQUEST_TEMPLATE.md`
   - Preserves all formatting and structure

4. **Analyze and Generate**
   - Generates PR title from branch name pattern:
     - Pattern: `(dev-name)/(task|bug|etc.)/(ticket-id)-(description)`
     - Extracts ticket ID and converts to uppercase
     - Replaces dashes with spaces
     - Format: `TICKET-ID: description`
   - Example: `sepehr/task/sa-ebca-11743-change` → `EBCA-11743: change`

5. **Fill PR Template**
   - Replaces `[JIRA-XXXX]` with actual ticket number
   - Fills "Pull Request Purpose" based on commits
   - Lists key changed files in "Key Classes" section
   - Maintains all checkboxes and formatting

6. **Show Preview and Confirm**
   - Displays complete PR preview
   - Asks for user confirmation
   - Creates PR using `gh pr create` command

## Command Configuration

The command is configured with specific allowed tools for security:

```yaml
allowed-tools: Bash(git:*), Bash(gh:*), Read
```

This means Claude can only:
- Run `git` commands to analyze your repository
- Run `gh` commands to create pull requests
- Read files (like the PR template)

## Branch Naming Convention

Expected pattern: `(dev-name)/(task|bug|etc.)/(ticket-id)-(description)`

**Example**: `sepehr/task/ebca-11743-change-copy-for-interact`

**Generated Title**: `EBCA-11743: change copy for interact`

**Note**: The command removes developer initials from ticket IDs:
- `sepehr/task/sa-ebca-11743-description` → `EBCA-11743: description`
- Developer initials (e.g., `sa` for Sepehr Alipour) are automatically stripped

## Customization

### Modify Command Behavior

Edit `auto-pr.md` to customize:

1. **Default Branch**: Change line 14
```markdown
- Default to `dev` if not specified
```

2. **Title Pattern**: Adjust instructions in step 4
```markdown
- Generate a PR title following this pattern:
  - Extract from branch name pattern: ...
```

3. **Template Location**: Modify step 3
```markdown
- Read the PR template from `../.github/PULL_REQUEST_TEMPLATE.md`
```

### Add Custom Fields

Add additional instructions in step 5:
```markdown
5. **Fill PR Template:**
   - Replace `[JIRA-XXXX]` with actual ticket
   - Add your custom field here
   - ...
```

## Advantages

### vs. Bash Script
- ✅ Natural language interaction
- ✅ Can ask follow-up questions
- ✅ More flexible and adaptive
- ✅ Integrated into Claude Code workflow
- ✅ No separate tool installation needed

### vs. Chrome Extension
- ✅ Works entirely in terminal
- ✅ No browser needed
- ✅ Automatic PR creation
- ✅ Direct integration with git workflow
- ✅ No API key configuration

## Troubleshooting

### Command Not Found

If `/auto-pr` doesn't work:
1. Check installation:
   ```bash
   ls ~/.claude/commands/auto-pr.md
   ```
2. Restart Claude Code
3. Try with full path: `/commands/auto-pr`

### Permission Denied on Git/GH Commands

The command is restricted to safe operations:
- If you need additional git commands, edit `allowed-tools` in `auto-pr.md`
- Ensure `gh` CLI is authenticated: `gh auth status`

### PR Template Not Found

Ensure your template is at:
```
../.github/PULL_REQUEST_TEMPLATE.md
```

Relative to your Claude Code working directory. Adjust the path in `auto-pr.md` if needed.

### Title Not Generated Correctly

Check your branch naming matches the expected pattern:
```
(dev-name)/(task|bug|etc.)/(ticket-id)-(description)
```

## Example Use Cases

### Quick PR Creation
```
/auto-pr
# Claude handles everything with minimal input
```

### Custom Target Branch
```
/auto-pr
Claude: What branch should this PR target?
You: staging
```

### Review Before Creating
```
/auto-pr
# Review generated content
# Make adjustments if needed
# Confirm when ready
```

## Tips

- **Trust the Process**: Claude will guide you through each step
- **Review Carefully**: Always review the PR preview before confirming
- **Iterate**: You can ask Claude to adjust the description before creating
- **Save Time**: Perfect for repetitive PR patterns in your workflow

## Back to Main Documentation

[← Back to main README](../README.md)

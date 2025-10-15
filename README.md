# Claude Auto PR Script

A bash script that uses Claude AI to automatically generate GitHub pull requests with properly formatted titles and filled templates.

## Prerequisites

- `gh` CLI tool installed and authenticated
- `claude` CLI tool installed and authenticated
- Git repository with a `.github/PULL_REQUEST_TEMPLATE.md` file
- Bash shell environment

## Installation

No installation needed. Just make the script executable:

```bash
chmod +x claude-auto-pr.sh
```

## Usage

Run the script from your git repository:

```bash
./claude-auto-pr.sh
```

### Interactive Flow

1. **Branch Detection**: Script detects your current branch
2. **Target Branch Selection**: Choose target branch (defaults to `dev`)
3. **AI Analysis**: Claude analyzes commits, changes, and template
4. **Review**: Review the generated PR title and body
5. **Confirmation**: Confirm to create the PR

## How It Works

1. **Gathers Git Data**:
   - Current branch name
   - Commits since target branch
   - Changed files
   - Git status

2. **AI Processing**:
   - Sends data to Claude CLI
   - Generates PR title from branch name pattern
   - Fills PR template with relevant information
   - Extracts JIRA ticket from branch/commits

3. **PR Creation**:
   - Uses `gh pr create` to create the pull request
   - Applies generated title and body

## Branch Naming Convention

Expected branch pattern: `dev-name/(task|bug|etc.)/ticket-id-description`

**Example**: `sepehr/task/ebca-11743-change-copy-for-interact`

**Generated Title**: `EBCA-11743: change copy for interact`

## Template Processing

The script automatically:
- Replaces `[JIRA-XXXX]` placeholders with actual ticket numbers
- Fills "Pull Request Purpose" section based on commits
- Lists key changed files in "Key Classes" section
- Preserves all checkboxes and formatting

## Output Files

Temporary files created during execution:
- `/tmp/claude_pr_response.txt` - Claude's full analysis
- `/tmp/pr_template.txt` - Processed template body

## Example Output

```
🤖 Gathering git information for Claude analysis...
📍 Current branch: sepehr/task/ebca-11760-move-native-auth-packages-to-ca

🌿 Available branches:
dev
main
...

🎯 What branch should this PR target? [dev]: dev
   → Target branch: dev

📊 Getting changes since dev...
📤 Sending all data to Claude for analysis...
📝 Claude analysis complete!

🚀 Ready to create PR:
   gh pr create --title "EBCA-11760: move native auth packages to ca" --base "dev" --body "[AI-generated template]"

Execute this command? (y/n):
```

## Error Handling

The script validates:
- PR title extraction
- Parent branch specification
- Template content generation

If any component is missing, it reports specific errors and exits without creating a PR.

## Notes

- Script uses `set -e` for fail-fast behavior
- Requires valid PR template at `../.github/PULL_REQUEST_TEMPLATE.md`
- Claude CLI must be available in PATH
- GitHub CLI must be authenticated with appropriate repository access

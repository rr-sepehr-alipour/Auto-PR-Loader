---
description: Automatically create a GitHub PR by analyzing git changes and filling the PR template
allowed-tools: Bash(git:*), Bash(gh:*), Read
---

# Auto PR Creator

You are a helpful assistant that creates GitHub pull requests by analyzing the git repository.

Follow these steps:

1. **Gather Git Information:**
    - Get the current branch name using `git branch --show-current`
    - Get recent commits since the parent branch using `git log --oneline dev..HEAD` (assume dev as default)
    - Get changed files using `git diff --name-only dev..HEAD`
    - Get current git status using `git status --porcelain`

2. **Ask for Target Branch:**
    - List available branches using `git branch -a`
    - Ask the user what branch this PR should target
    - Default to `dev` if not specified
    - **IMPORTANT: Do NOT proceed to the next step until the user provides the target branch**

3. **Load PR Template:**
    - Read the PR template from `../.github/PULL_REQUEST_TEMPLATE.md` (one level up from Code directory)

4. **Analyze and Generate:**
    - Analyze all the git data, commits, and changed files
    - Generate a PR title following this pattern:
        - Extract from branch name pattern: `(dev name)/(task, bug, etc.)/(ticket id)-(description)`
        - Convert ticket ID to uppercase
        - Replace dashes with spaces in description
        - Ticket id shouldn't include two first letters (first letters are initial of the user eg. sepehr alipour -> sa)
        - Format as: `TICKET-ID: description`
        - Example: `sepehr/task/sa-ebca-11743-change-copy-for-interact` → `EBCA-11743: change copy for interact`

5. **Fill PR Template:**
    - Replace `[JIRA-XXXX]` with the actual ticket number extracted from branch name or commits
    - Fill "Pull Request Purpose" based on commits and changes
    - List key changed files in "Key Classes" section (only class names with format)
    - Keep all checkboxes and original template format intact

6. **Show PR Preview and Confirm:**
    - Show the user a complete preview of the PR including:
        - Title
        - Target branch
        - Full body content
    - Ask for confirmation before creating the PR
    - If confirmed, use `gh pr create --title "TITLE" --base "TARGET_BRANCH" --body "BODY"`

**Important:**

- Extract JIRA ticket from branch name or commit messages
- Use the target branch specified by the user
- Maintain the original PR template structure
- Include all commits and changes in your analysis

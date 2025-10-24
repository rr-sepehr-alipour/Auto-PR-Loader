# PR Creation Skill

An automated agent that creates comprehensive pull request descriptions by analyzing your git history and following your project's PR template.

## Prerequisites

- Git repository (committed changes recommended, but skill handles uncommitted changes)
- **GitHub CLI** (recommended): `gh` from [cli.github.com](https://cli.github.com) - authenticate with `gh auth login`
- PR template (optional): `.github/pull_request_template.md` in your repo

## How to Invoke

Simply ask Claude to create a PR:
- "Create a PR for my changes"
- "Help me create a pull request"
- "I'm ready to submit a PR"

Claude will automatically invoke the **pr-creation** skill and guide you through the process.

## When to Use

Invoke when you're ready to create a PR or need help writing a PR description.

## Key Features

- **Flexible ticket support**: Auto-detects Jira tickets (default) or works without any ticket system
- **Smart analysis**: Checks git state, reviews commits, analyzes diffs with size warnings (>100 files or >5,000 lines)
- **Template handling**: Searches multiple locations, handles missing templates gracefully
- **Draft PR support**: Create draft or ready-for-review PRs
- **Configurable**: Works with any base branch (main, dev, develop, etc.)
- **Safe**: Validates everything before proceeding, never fabricates information

## How It Works

### 1. Information Collection
- Detects current branch and attempts to extract Jira ticket key (e.g., `ABC-123` from `feature/ABC-123-fix-login`)
- If no ticket found, asks if you want to provide one or proceed without
- Extracts description from branch name

### 2. Confirmation
- Shows: branch name, ticket (if any), proposed PR title
- Asks for target base branch and waits for your response
- Asks if you want draft or ready-for-review and waits for your response
- Asks for final approval to continue with analysis

### 3. Analysis
- Checks for uncommitted changes and unpushed branches
- Finds PR template (searches multiple locations: `.github/`, `docs/`, etc.)
- Reviews commit history for context
- Analyzes diff with size checking - warns if very large
- Identifies: features, fixes, refactors, breaking changes, dependencies, tests, etc.

### 4. PR Creation
- Maps findings to your template sections
- Asks targeted questions to fill any gaps
- Generates complete PR description matching template exactly
- Verifies GitHub CLI availability (provides manual commands if not installed)
- Creates PR with appropriate title:
  - With ticket: `ABC-123: Short description`
  - Without ticket: `Short description`
- Returns PR URL

## Usage Example

```
You: "Create a PR for my changes"

Agent: "I'll help you create a pull request. Let me analyze your branch..."

Agent: "I've identified the following information:
- Branch: feature/ABC-123-update-login
- Jira ticket: ABC-123
- PR title: ABC-123: Update login error handling

What is the target base branch for this PR (e.g., main, dev, develop)?"

You: "main"

Agent: "Would you like to create this as a draft PR or ready for review?"

You: "ready for review"

Agent: "Is this information correct? Should I proceed with gathering the git diff?"

You: "yes"

Agent: "Verifying git state..."
Agent: "Locating PR template..."
Agent: "Analyzing commit history and changes..."

[Agent maps findings to template and asks any clarifying questions]

Agent: "Creating pull request..."
Agent: "✓ Pull request created successfully: https://github.com/org/repo/pull/123"
```

## Edge Cases Handled

- **No Jira ticket**: Proceeds without ticket reference
- **Uncommitted changes**: Warns and offers to commit first
- **Unpushed branch**: Automatically pushes before creating PR
- **Large PRs**: Warns about size and offers to focus on key files or split
- **Missing template**: Asks for custom path or proceeds without
- **No GitHub CLI**: Provides manual git commands
- **Empty diff**: Alerts about no changes detected

## Tips

1. **Use descriptive branch names** with ticket references when applicable
2. **Keep PRs focused** - the skill warns about large PRs
3. **Write clear commit messages** - they enrich the PR description
4. **Create a PR template** in `.github/pull_request_template.md` for consistency
5. **Install GitHub CLI** for automatic PR creation
6. **Commit your changes** before invoking (recommended but not required - skill will prompt if uncommitted changes exist)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Can't find PR template | Check template is in `.github/` or `docs/`, or provide custom path |
| Branch not pushed | Skill will push automatically, or push manually: `git push -u origin <branch>` |
| No GitHub CLI | Install from [cli.github.com](https://cli.github.com) or use manual commands |
| PR too large | Split into smaller PRs or focus on key files only |
| Don't use Jira | Just say "proceed without" when asked about tickets |

## Quality Assurance

Before creating the PR, the skill ensures:
- ✓ All template sections populated or marked "N/A" with justification
- ✓ Formatting exactly matches template
- ✓ No fabricated information
- ✓ Proper checklist syntax
- ✓ Ticket format validated (if applicable)
- ✓ All information confirmed by you

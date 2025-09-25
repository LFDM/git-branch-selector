## Installation

- Run `npm install`
- Run `npm run link:global` to build and make globally accessible as `git-branch-selector`
- After linking once, just run `npm run build` to release updates

## Usage

- `git-branch-selector` — select a branch and return its name
- `git-branch-selector checkout` — select a branch and perform `git checkout <branch>`
- `git-branch-selector rebase` — select a branch to rebase onto and run `git rebase <branch>`

## Notes

- The list is sorted by most recently committed branches.
- Fuzzy search supports subsequence matching (characters in order, not necessarily contiguous).

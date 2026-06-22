# moonlighter (`mnl`)

Manage multiple GitHub SSH identities without host aliases. Switching accounts is
one command — `git@github.com:...` always works as-is, no `github.com-work` style
remotes needed.

## How it works

`~/.ssh` is turned into its own tiny git repo. Each identity (username + email +
SSH key) lives on its own branch. The `config` file (your real SSH config) is
committed per branch, so checking out a branch swaps in that identity's
`IdentityFile` automatically. Your global `git user.name` / `user.email` are
updated to match on every switch.

## Commands

```
mnl init      # first-time setup, creates your first identity
mnl add       # register another GitHub account
mnl switch    # pick which identity is active
mnl list      # show saved identities (marks the active one)
mnl remove    # delete a saved identity
```

## Setup

```
npm install
npm link        # makes `mnl` available globally
mnl init
```

After `mnl init` or `mnl add`, copy the printed `cat ~/.ssh/<key>.pub` output
into GitHub under **Settings → SSH and GPG keys**.

## Notes

- Private key files are generated into `~/.ssh` but are intentionally **not**
  committed to the internal git repo — only `config` and `signal` (the
  username/email registry) are tracked. Don't run `git clean` inside `~/.ssh`;
  it would delete every key you've generated since they're untracked.
- This repo never gets a remote added — it's purely local bookkeeping. Don't
  push it anywhere.

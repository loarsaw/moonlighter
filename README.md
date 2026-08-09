# moonlighter (`mnl`)

Manage multiple GitHub and GitLab SSH identities without host aliases.
Switching accounts is one command — `git@github.com:...` / `git@gitlab.com:...`
always work as-is, no `github.com-work` style remotes needed.

## How it works

`~/.ssh` is turned into its own tiny git repo. Each identity (provider +
username + email + SSH key) lives on its own branch. The `config` file (your
real SSH config) is committed per branch, so checking out a branch swaps in
that identity's `IdentityFile` automatically. Your global `git user.name` /
`user.email` are updated to match on every switch.

## Commands

```
mnl init      # first-time setup, creates your first identity
mnl add       # register another GitHub or GitLab account
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

`mnl init` will ask which provider (GitHub or GitLab) the identity is for.
After `mnl init` or `mnl add`, copy the printed `cat ~/.ssh/<key>.pub` output
into that provider's SSH key settings:

- GitHub: **Settings → SSH and GPG keys**
- GitLab: **Preferences → SSH Keys**

## Windows setup

moonlighter shells out to `git`, `ssh`, and `ssh-keygen`, so all three need to
be on your `PATH` before running `mnl init`.

1. **Install Git for Windows** — https://git-scm.com/download/win. This
   bundles its own `git`, `ssh`, and `ssh-keygen` binaries and, by default,
   adds them to `PATH` (the installer's "Git from the command line and also
   from 3rd-party software" option, which is the default — keep it checked).
2. **Or use the built-in OpenSSH Client** — Windows 10/11 usually ships this,
   but it can be turned off. Check with:
   ```
   Get-WindowsCapability -Online | Where-Object Name -like 'OpenSSH*'
   ```
   If `OpenSSH.Client` isn't `Installed`, add it:
   ```
   Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0
   ```
3. **Verify everything is reachable** in a fresh terminal (PowerShell, cmd,
   or Git Bash — close and reopen it after installing, so the updated `PATH`
   is picked up):
   ```
   git --version
   ssh -V
   ssh-keygen -?
   ```
   If any of these say "not recognized", that tool's install location isn't
   on `PATH` — re-run the installer and confirm the PATH option, or add it to
   `PATH` manually via **Settings → System → About → Advanced system settings
   → Environment Variables**.
4. **Run moonlighter from the same shell** where step 3 succeeded. Git Bash,
   PowerShell, and cmd all work — just be consistent, since `git@github.com`
   remotes and this tool don't care which shell you use, only whether the
   binaries are reachable from it.
5. `~/.ssh` (i.e. `%USERPROFILE%\.ssh`) doesn't need to exist beforehand —
   `mnl init` creates it if missing.

## Notes

- Private key files are generated into `~/.ssh` but are intentionally **not**
  committed to the internal git repo — only `config` and `signal` (the
  identity registry) are tracked. Don't run `git clean` inside `~/.ssh`; it
  would delete every key you've generated since they're untracked.
- This repo never gets a remote added — it's purely local bookkeeping. Don't
  push it anywhere.
- Usernames are shared across providers in the current branch-naming scheme —
  a GitHub `alice` and a GitLab `alice` can't both exist. Use distinct names
  (e.g. `alice-gh` / `alice-gl`) if you need both.

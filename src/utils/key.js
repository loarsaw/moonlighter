import { execFile as execFileCb } from "node:child_process";
import { homedir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import {
  existsSync,
  readFileSync,
  writeFileSync,
  appendFileSync,
  readdirSync,
  unlinkSync,
} from "node:fs";

const execFile = promisify(execFileCb);

export const sshPath = join(homedir(), ".ssh");
export const configPath = join(sshPath, "config");
export const signalPath = join(sshPath, "signal");
const gitignorePath = join(sshPath, ".gitignore");

export const RESERVED_NAMES = ["root", "master", "main", "config", "signal"];

const git = (args) => execFile("git", args, { cwd: sshPath });

// --- Repo setup ----------------------------------------------------------

export async function ensureGitRepo() {
  if (existsSync(join(sshPath, ".git"))) {
    // Migration: if signal is still tracked by git, stop tracking it.
    // signal must be a plain file that never reverts on branch checkout —
    // it's a global registry, not per-identity state.
    try {
      await git(["rm", "--cached", "signal", "-q"]);
      await git(["commit", "-m", "untrack signal (moonlighter migration)", "--allow-empty"]);
    } catch {
      // already untracked — fine
    }
    return { alreadyInitialized: true };
  }

  await execFile("git", ["init", "--initial-branch=root"], { cwd: sshPath });
  if (!existsSync(configPath)) writeFileSync(configPath, "", "utf8");
  if (!existsSync(signalPath)) writeFileSync(signalPath, "", "utf8");

  // Only track config and .gitignore — never signal or private keys.
  writeFileSync(
    gitignorePath,
    "# moonlighter: only config is tracked per branch\nsignal\n*.pub\n*\n!config\n!.gitignore\n",
    "utf8"
  );

  return { alreadyInitialized: false };
}

// --- SSH key generation ---------------------------------------------------

export async function keyGen({ username, email }) {
  // -N "" skips the passphrase prompt so this can run non-interactively.
  await execFile(
    "ssh-keygen",
    ["-t", "ed25519", "-f", username, "-N", "", "-C", email],
    { cwd: sshPath }
  );
}

export function listPublicKeys() {
  if (!existsSync(sshPath)) return [];
  return readdirSync(sshPath).filter((f) => f.endsWith(".pub"));
}

export function deleteKeyFiles(id) {
  for (const file of [id, `${id}.pub`]) {
    const filePath = join(sshPath, file);
    if (existsSync(filePath)) unlinkSync(filePath);
  }
}

// --- ssh config ------------------------------------------------------------

const MARKER_START = "# >>> moonlighter github.com >>>";
const MARKER_END = "# <<< moonlighter github.com <<<";

export function writeConfig(id) {
  const block = `${MARKER_START}
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/${id}
  IdentitiesOnly yes
${MARKER_END}`;

  let existing = existsSync(configPath) ? readFileSync(configPath, "utf8") : "";
  const blockRegex = new RegExp(`${MARKER_START}[\\s\\S]*?${MARKER_END}`, "m");

  if (blockRegex.test(existing)) {
    existing = existing.replace(blockRegex, block);
  } else {
    existing = existing.trim() + (existing.trim() ? "\n\n" : "") + block + "\n";
  }

  writeFileSync(configPath, existing, "utf8");
}

// --- signal file (username,email registry) ---------------------------------
// signal is intentionally NOT committed to git — it's a plain append-only file
// so it survives branch switches unchanged.

export function writeSignal(username, email) {
  writeFileSync(signalPath, `${username},${email}\n`, "utf8");
}

export function appendSignal(username, email) {
  appendFileSync(signalPath, `${username},${email}\n`, "utf8");
}

export function listIdentities() {
  if (!existsSync(signalPath)) return [];
  return readFileSync(signalPath, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [username, email] = line.split(",");
      return { username, email };
    });
}

export function removeSignalEntry(username) {
  const remaining = listIdentities().filter((i) => i.username !== username);
  const content = remaining.map((i) => `${i.username},${i.email}\n`).join("");
  writeFileSync(signalPath, content, "utf8");
  return remaining;
}

// --- git branches (one per identity) ----------------------------------------

export async function getCurrentBranch() {
  const { stdout } = await git(["branch", "--show-current"]);
  return stdout.trim();
}

export async function branchExists(name) {
  const { stdout } = await git(["branch", "--list", name]);
  return stdout.trim().length > 0;
}

export async function createBranch(username) {
  await git(["checkout", "-b", username]);
}

export async function checkoutBranch(username) {
  await git(["checkout", username]);
}

export async function deleteBranch(username) {
  await git(["branch", "-D", username]);
}

// Only commit config — never signal
export async function commitAll(message) {
  await git(["add", "config"]);
  await git(["commit", "-m", message, "--allow-empty"]);
}

// --- git identity (global user.name / user.email) ---------------------------

export async function setGitIdentity(name, email) {
  await execFile("git", ["config", "--global", "user.name", name]);
  await execFile("git", ["config", "--global", "user.email", email]);
}

// --- connection check --------------------------------------------------------

export async function testConnection() {
  // GitHub's SSH test endpoint exits 1 even on success (no shell access granted),
  // so a successful auth has to be detected from the message, not the exit code.
  try {
    const { stdout, stderr } = await execFile("ssh", ["-T", "git@github.com"]);
    return { success: true, message: (stdout || stderr).trim() };
  } catch (err) {
    const output = (err.stderr || err.message || "").trim();
    return {
      success: output.includes("successfully authenticated"),
      message: output,
    };
  }
}

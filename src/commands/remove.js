import inquirer from "inquirer";
import {
  listIdentities,
  removeSignalEntry,
  getCurrentBranch,
  checkoutBranch,
  deleteBranch,
  commitAll,
  deleteKeyFiles,
} from "../utils/key.js";

export default async function removeKey() {
  const identities = listIdentities();
  if (identities.length === 0) {
    console.log("No identities found.");
    return;
  }

  const { username } = await inquirer.prompt([
    {
      type: "list",
      name: "username",
      message: "Remove which identity?",
      choices: identities.map((i) => ({
        name: `${i.username} <${i.email}>`,
        value: i.username,
      })),
    },
  ]);

  const { deleteFiles } = await inquirer.prompt([
    {
      type: "confirm",
      name: "deleteFiles",
      message: `Also delete the SSH key files for "${username}" from disk?`,
      default: false,
    },
  ]);

  const current = await getCurrentBranch();
  if (current === username) {
    const fallback = identities.find((i) => i.username !== username);
    if (!fallback) {
      console.log("Can't remove the only identity while it's active.");
      return;
    }
    await checkoutBranch(fallback.username);
    console.log(`Switched to "${fallback.username}" before removing.`);
  }

  removeSignalEntry(username);
  await commitAll(`remove ${username}`);
  await deleteBranch(username).catch(() => {
    // branch may already be gone — not fatal
  });

  if (deleteFiles) {
    deleteKeyFiles(username);
  }

  console.log(`Removed "${username}".`);
}

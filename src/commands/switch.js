import inquirer from "inquirer";
import {
  listIdentities,
  getCurrentBranch,
  checkoutBranch,
  setGitIdentity,
  testConnection,
} from "../utils/key.js";

export default async function switchKey() {
  const identities = listIdentities();
  if (identities.length === 0) {
    console.log("No identities found. Run `mnl init` first.");
    return;
  }

  const current = await getCurrentBranch();

  const { selected } = await inquirer.prompt([
    {
      type: "list",
      name: "selected",
      message: "Switch to which account?",
      choices: identities.map((i) => ({
        name: `${i.username} <${i.email}>${
          i.username === current ? "  (current)" : ""
        }`,
        value: i.username,
      })),
    },
  ]);

  if (selected === current) {
    console.log(`Already on "${selected}".`);
    return;
  }

  const identity = identities.find((i) => i.username === selected);

  // Checking out the branch swaps in that identity's ~/.ssh/config automatically,
  // since each branch's config was committed at creation time.
  await checkoutBranch(selected);
  await setGitIdentity(selected, identity.email);

  console.log(
    `Switched to "${selected}" <${identity.email}> (${identity.host}).`
  );
  console.log("Testing connection...");
  const result = await testConnection(identity.host);
  console.log(result.success ? `✓ ${result.message}` : `✗ ${result.message}`);
}

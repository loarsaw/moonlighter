import inquirer from "inquirer";
import {
  keyGen,
  listPublicKeys,
  writeConfig,
  appendSignal,
  createBranch,
  commitAll,
  branchExists,
  setGitIdentity,
  RESERVED_NAMES,
} from "../utils/key.js";

export default async function addKey() {
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "username",
      message: "Enter your username:",
      validate: async (input) => {
        if (!input) return "Username is required.";
        if (RESERVED_NAMES.includes(input))
          return `"${input}" is reserved, pick another name.`;
        if (await branchExists(input))
          return `An identity named "${input}" already exists. Use "mnl switch" instead.`;
        return true;
      },
    },
    {
      type: "input",
      name: "email",
      message: "Enter your email:",
      validate: (input) =>
        /\S+@\S+\.\S+/.test(input) ? true : "Please enter a valid email.",
    },
  ]);

  const { choice } = await inquirer.prompt([
    {
      type: "list",
      name: "choice",
      message: "SSH Key",
      choices: ["Create SSH Key", "Use Existing"],
    },
  ]);

  let keyId = answers.username;

  if (choice === "Create SSH Key") {
    console.log("Generating key...");
    await keyGen(answers);
  } else {
    const files = listPublicKeys();
    if (files.length === 0) {
      console.log(
        "No existing .pub files found in ~/.ssh — generating a new key instead."
      );
      await keyGen(answers);
    } else {
      const { selectedFile } = await inquirer.prompt([
        {
          type: "list",
          name: "selectedFile",
          message: "Select a key:",
          choices: files,
        },
      ]);
      keyId = selectedFile.replace(".pub", "");
    }
  }

  await createBranch(answers.username);
  writeConfig(keyId);
  appendSignal(answers.username, answers.email);
  await commitAll(answers.username);
  await setGitIdentity(answers.username, answers.email);

  console.log(`\nAdded and switched to "${answers.username}" <${answers.email}>.`);
  if (choice === "Create SSH Key") {
    console.log(
      `Add this key to GitHub: cat ~/.ssh/${keyId}.pub — then paste it under Settings → SSH keys.`
    );
  }
}

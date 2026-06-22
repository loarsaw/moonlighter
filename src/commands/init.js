import inquirer from "inquirer";
import {
  ensureGitRepo,
  keyGen,
  listPublicKeys,
  writeConfig,
  writeSignal,
  createBranch,
  commitAll,
  setGitIdentity,
  RESERVED_NAMES,
} from "../utils/key.js";

export default async function init() {
  const { alreadyInitialized } = await ensureGitRepo();
  if (alreadyInitialized) {
    console.log(
      "Already set up. Use `mnl add` to add another account, or `mnl switch` to change identity."
    );
    return;
  }

  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "username",
      message: "Enter your username:",
      validate: (input) => {
        if (!input) return "Username is required.";
        if (RESERVED_NAMES.includes(input))
          return `"${input}" is reserved, pick another name.`;
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

  await setGitIdentity(answers.username, answers.email);

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

  writeConfig(keyId);
  writeSignal(answers.username, answers.email);
  await commitAll("root");
  await createBranch(answers.username);

  console.log(
    `\nDone. Identity "${answers.username}" <${answers.email}> is active.`
  );
  console.log(
    `Add this key to GitHub: cat ~/.ssh/${keyId}.pub — then paste it under Settings → SSH keys.`
  );
}

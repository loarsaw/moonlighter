import { homedir } from "os";
import {
  addBranchCommit,
  appendSingal,
  createBranch,
  keyGen,
  writeConfig,
} from "../utils/key.js";
import inquirer from "inquirer";
import { unlinkSync } from "fs";

const sshPath = `${homedir}/.ssh`;

export default async function addKey() {
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "username",
      message: "Enter your username:",
      validate: (input) => (input ? true : "Username is required."),
    },
    {
      type: "input",
      name: "email",
      message: "Enter your email:",
      validate: (input) =>
        /\S+@\S+\.\S+/.test(input) ? true : "Please enter a valid email.",
    },
  ]);

  await keyGen(answers);
  await createBranch(answers.username);
  unlinkSync(`${sshPath}/config`);
  await writeConfig(answers.username);
  await appendSingal(answers.username, answers.email);
  await addBranchCommit(answers);
}

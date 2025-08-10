import { exec } from "child_process";
import { homedir, platform } from "os";
import { join } from "node:path";
import inquirer from "inquirer";
import { writeFileSync, existsSync, writeFile, readdirSync } from "node:fs";

const sshPath = `${homedir()}/.ssh`;
const config_hd = `${sshPath}/config`;

const system_type = platform();
function initGit() {
  return new Promise((resolve, reject) => {
    exec(
      "git init --initial-branch=root",
      { cwd: sshPath },
      (error, stdout, stderr) => {
        if (error) {
          console.error(`Error: ${error.message}`);
          return;
        }
        console.log(system_type, "his");
        if (system_type === "win32") {
          if (fs.existsSync(config_hd)) {
            console.log("Setup Complete");
          } else {
            try {
              const filePath = join(sshPath, "config");
              // const folderPath = join(sshPath);
              writeFileSync(filePath, "", "utf8");
              exec(
                "git add config",
                { cwd: sshPath },
                (error, stdout, stderr) => {
                  if (error) {
                    reject({ success: false });
                    console.error(`Error: ${error.message}`);
                    return;
                  }
                  // if (stderr) {
                  //   console.error(`stderr: ${stderr}`);
                  //   return;
                  // }
                  // exec(
                  //   `git commit -m  "first"`,
                  //   { cwd: sshPath },
                  //   (error, stdout, stderr) => {
                  //     if (error) {
                  //       console.error(`Error: ${error.message}`);
                  //       return;
                  //     }
                  //     if (stderr) {
                  //       console.error(`stderr: ${stderr}`);
                  //       return;
                  //     }
                  //     console.log(
                  //       "Done",
                  //       "You think GENZ is bad wait till Aplha shows up at office"
                  //     );
                  //   }
                  // );
                }
              );

              console.log("Setup Complete");
            } catch (err) {
              reject({ success: false });
              console.error("Failed to write file:", err.message);
            }
          }
        } else if (system_type === "darwin" || system_type == "linux") {
          if (existsSync(config_hd)) {
            console.log("Setup Complete");
          }
        } else {
          console.error(`What in the I-USE-ARCHLINUX-BTW are you using`);
        }

        console.log(`stdout:\n${stdout}`);
        resolve({ success: true });
      }
    );
  });
}

function writeConfig(id) {
  const config_content = `
  Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/${id}
  `;

  return new Promise((resolve, reject) => {
    writeFile(join(sshPath, "config"), config_content, "utf8", (error) => {
      if (error) {
        reject({ success: false });

        console.error("error", error);
        return;
      }
      resolve({ success: true });
    });
  });
}
function writeSignal(id, email) {
  const signal_content = `${id},${email}\n`;

  return new Promise((resolve, reject) => {
    writeFile(join(sshPath, "signal"), signal_content, "utf8", (error) => {
      if (error) {
        reject({ success: false });

        console.error("error", error);
        return;
      }
      resolve({ success: true });
    });
  });
}

function createBranch(username) {
  return new Promise((resolve, reject) => {
    exec(`git checkout -b ${username}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        reject({ success: false });
        return;
      }

      console.log("executed");
      console.log(stdout);
      resolve({ success: true });
    });
  });
}
function addRootCommit(answers) {
  return new Promise((resolve, reject) => {
    exec(
      `git add config && git add signal && git commit -m "root"`,
      (error, stdout, stderr) => {
        if (error) {
          console.error(`Error: ${error.message}`);
          reject({ success: false });
          return;
        }

        console.log("executed");
        console.log(stdout);
        resolve({ success: true });
      }
    );
  });
}

function setUpConfig(answers) {
  return new Promise((resolve, reject) => {
    exec(
      `git config --global user.name "${answers.username}" && git config --global user.email "${answers.email}"`,
      (error, stdout, stderr) => {
        if (error) {
          console.error(`Error: ${error.message}`);
          reject({ success: false });
          return;
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`);
          return;
        }
        console.log(stdout);
        resolve({ success: true });
      }
    );
  });
}

async function selectKey() {
  // return new Promise((resolve, reject) => {
  //   exec(
  //     "ls | grep '\\.pub$'",
  //     { cwd: sshPath },
  //     async (error, stdout, stderr) => {
  //       if (error) {
  //         console.error(`Error: ${error.message}`);
  //         reject();
  //         return;
  //       }
  //       // if (stderr) {
  //       //   console.error(`Stderr: ${stderr}`);
  //       //   reject();
  //       //   return;
  //       // }

  //       // Convert ls output into an array
  //       const files = stdout.trim().split("\n");

  // const { selectedFile } = await inquirer.prompt([
  //   {
  //     type: "list",
  //     name: "selectedFile",
  //     message: "Select a file:",
  //     choices: files,
  //   },
  // ]);
  //       resolve(selectedFile.replace(".pub", ""));
  //     }
  //   );
  // });
  const files = readdirSync(sshPath) // current directory
    .filter((file) => file.endsWith(".pub"));
  console.log(files, "asa");
  const { selectedFile } = await inquirer.prompt([
    {
      type: "list",
      name: "selectedFile",
      message: "Select a file:",
      choices: files,
    },
  ]);
  return selectedFile.replace(".pub", "");
}

function keyGen(answers) {
  return new Promise((resolve, reject) => {
    exec(
      `ssh-keygen -t ed25519 -f ${answers.username} -C "${answers.email}"`,
      (error, stdout, stderr) => {
        if (error) {
          console.error(`Error: ${error.message}`);
          reject({ success: false });
          return;
        }

        console.log("executed");
        console.log(stdout);
        resolve({ success: true });
      }
    );
  });
}

export default async function init() {
  const ans = await initGit();
  if (ans.success) {
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
    const value = await setUpConfig(answers);

    if (value.success) {
      const { choice } = await inquirer.prompt([
        {
          type: "list",
          name: "choice",
          message: "SSH Key",
          choices: ["Create SSH KEY", "Use Existing"],
        },
      ]);

      if (choice === "Create SSH KEY") {
        console.log("Uploading...");
        await keyGen(answers);
        await writeConfig(answers.username);
        await writeSignal(answers.username, answers.email);
        await addRootCommit();
        await createBranch(answers.username);
      } else {
        const value = await selectKey();
        await writeConfig(value);
        await writeSignal(answers.username, answers.email);
        await addRootCommit();
        await createBranch(value);
      }
    }
  }
}

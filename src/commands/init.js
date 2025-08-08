import { exec } from "child_process";
import { homedir, platform } from "os";
import { join } from "node:path";
import inquirer from "inquirer";

import { writeFileSync, existsSync } from "node:fs";
const sshPath = `${homedir()}/.ssh/`;
const config_hd = `${sshPath}/config`;

const system_type = platform();
function initGit() {
  return new Promise((resolve, reject) => {
    exec("git init", { cwd: sshPath }, (error, stdout, stderr) => {
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
        } else {
          const filePath = join(sshPath, "config");
          writeFileSync(filePath, "", "utf8", (error) => {
            if (error) {
              reject({ success: false });

              console.error("error", error);
            }
          });

          console.log("Setup Complete");
        }
      } else {
        console.error(`What in the ARCHLINUX are you using`);
      }

      console.log(`stdout:\n${stdout}`);
      resolve({ success: true });
    });
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
        console.log("executed");
        console.log(stdout);
        resolve({ success: true });
      }
    );
  });
}
export default async function init() {
  const ans = await initGit();
  console.log(ans);
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
      } else {
        console.log("Goodbye!");
      }
    }
  }
}

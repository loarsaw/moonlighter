import { appendFile } from "fs";
import { homedir } from "os";
import { exec } from "child_process";
import { join } from "node:path";
import { writeFile } from "node:fs";
const sshPath = `${homedir}/.ssh`;

export function keyGen(answers) {
  return new Promise((resolve, reject) => {
    console.log("Using ED25519");
    exec(
      `ssh-keygen -t ed25519 -f ${answers.username} -C "${answers.email}"`,
      { cwd: sshPath },
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

export function createBranch(username) {
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

export function addBranchCommit(answers) {
  return new Promise((resolve, reject) => {
    exec(
      `git add config && git add signal && git commit -m "${answers.username}"`,
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

export function appendSingal(id, email) {
  const signal_content = `${id},${email}\n`;

  return new Promise((resolve, reject) => {
    appendFile(join(sshPath, "signal"), signal_content, "utf8", (error) => {
      if (error) {
        reject({ success: false });

        console.error("error", error);
        return;
      }
      resolve({ success: true });
    });
  });
}





export function writeConfig(id) {
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

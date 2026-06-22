import { listIdentities, getCurrentBranch } from "../utils/key.js";

export default async function listKeys() {
  const identities = listIdentities();
  if (identities.length === 0) {
    console.log("No identities found. Run `mnl init` first.");
    return;
  }

  const current = await getCurrentBranch();

  console.log("\nSaved identities:\n");
  identities.forEach(({ username, email }) => {
    const marker = username === current ? "→" : " ";
    console.log(`${marker} ${username}  <${email}>`);
  });
  console.log("");
}

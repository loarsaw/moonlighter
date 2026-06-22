#!/usr/bin/env node
import { Command } from "commander";
import init from "../src/commands/init.js";
import addKey from "../src/commands/add.js";
import switchKey from "../src/commands/switch.js";
import listKeys from "../src/commands/list.js";
import removeKey from "../src/commands/remove.js";

const program = new Command();

function action(fn) {
  return async (...args) => {
    try {
      await fn(...args);
    } catch (err) {
      console.error("Error:", err.message || err);
      process.exitCode = 1;
    }
  };
}

program
  .name("mnl")
  .description(
    "Manage multiple GitHub SSH identities without juggling host aliases on clone"
  )
  .version("1.0.0");

program
  .command("init")
  .description("Set up moonlighter and create your first identity")
  .action(action(init));

program
  .command("add")
  .description("Add a new GitHub identity")
  .action(action(addKey));

program
  .command("switch")
  .description("Switch the active GitHub identity")
  .action(action(switchKey));

program
  .command("list")
  .alias("ls")
  .description("List all saved identities")
  .action(action(listKeys));

program
  .command("remove")
  .alias("rm")
  .description("Remove a saved identity")
  .action(action(removeKey));

program.parse();

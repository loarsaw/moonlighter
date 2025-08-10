#!/usr/bin/env node
import { Command } from "commander";
import init from "../src/commands/init.js";
import addKey from "../src/commands/add.js";
const program = new Command();

program.name("moonlighter").description("Made with Pure Hate").version("0.0.0");

program.command("init").description("Say hello to someone").action(init);
program.command("add").description("Add SSH Key").action(addKey);

program.parse();

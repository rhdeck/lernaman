#!/usr/bin/env node
const commander = require("commander");
const mal = require("../index.js");
commander
  .command("add <url> [name]")
  .option("-i --init", "Initialize afterward")
  .option("-u --update", "Update lerna afterward")
  .description("Add a lerna from repository or path")
  .action((url, name, opts) => {
    mal.add(url, name, process.cwd());
    if (opts.init || opts.update) {
      mal.init(name);
      if (opts.update) {
        mal.update(name);
        mal.link(name);
      }
    }
  });
commander
  .command("init [name]")
  .description("Initialize lerna [name] ( all if unspecified")
  .option("-u --update", "Update lerna(s) afterward")
  .action((name, opts) => {
    if (!name) {
      mal.initAll(process.cwd());
      if (opts.update) {
        mal.updateAll(process.cwd());
      }
    } else {
      mal.init(name, null, process.cwd());
      if (opts.update) {
        mal.update(name, null, process.cwd());
      }
    }
  });
commander
  .command("update [name]")
  .description("Update already-initialized lerna [name] ")
  .action(name => {
    if (!name) mal.updateAll(process.cwd());
    else mal.update(name, null, process.cwd());
  });
commander
  .command("link [name]")
  .description("Re-link the named lerna (all if not specified)")
  .action(name => {
    if (!name) mal.linkAll(process.cwd());
    else mal.link(name, null, process.cwd());
  });
commander
  .command("remove <name>")
  .description("Remove the named lerna")
  .action(name => {
    mal.remove(name);
  });
commander.parse(process.argv);

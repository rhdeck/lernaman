# lernaman

Manager for arranging/managing lerna-based packages under your app project.

# Why?

React-native's metro builder really doesn't like working with peer directories. So the easiest way to get benefit from managing your JS modules is to use a lerna-managed monorepo, and then link those packages to your app in a parent/ancestor directory.

Basically,it makes JS development for nontrivial React-native much much easier.

# Installation

This is easier than manual work, but it still has some steps:

1. Make a lerna-based repository with the code you want to use. (for example https://github.com/me/modules)
2. Make an app using `react-native init` or `create-react-native-app`
3. Switch to your app directory
4. `yarn add lernaman`
5. `yarn run lernaman add https://github.com/me/modules --update`
6. Set your "root" component to be one of your modules - using the pakage name. (I like to use `react-native-set-root` for this, eg `react-native-set-root @rhdeck/rootmodule`)
7. `yarn start`
8. Oops! Discover your missing dependencies (probably defined as `peerDependencies` in your module) and `yarn add` them.
9. 'yarn start' again, and watch everything _just work_

# Rehydration

Later, when you have committed your app then pull it down somewhere later, after your initial `git clone` and `yarn install` steps, run `yarn run lernaman init --update` to get your lerna packages deployed into your app. That's all there is to it!

# Usage

## lernaman --help

Get listing of commands. Useful.

## lernaman add <url> [name][--init] [--update]

## lernaman init [name][--update]

Initialize lerna package [name] that is specified in `package.json` by copying/cloning into the appropriate directory. If --update is passed, the functionality of `lernaman update [name]` gets applied subsequently.

If name is not supplied, it will run the link process for all.

## lernaman update [name]

NPM/Yarn isntall an initialized lerna package `[name]`, bootstrap it, and run the "build" script defined within. Will automatically run the `lernaman link` functionality immediately after.

If name is not supplied, it will run the link process for all.

## lernaman link [name]

Deploy symbolic links from the packages managed at `lernas/[name]` to your immediate node_modules directory. No bootstrap or other build process is applied.

If name is not supplied, it will run the link process for all.

## lernaman remove <name>

Remove the package at `lernas/[name]`. The package itself is recursively removed and the entry in package.json is eliminated to prevent future re-hydration.

# Notes

This tool is for handling a complex situation, so it takes a little more work to get the most out of it. But

#!/usr/bin/env node

import { defineCommand } from "citty"
import consola from "consola"
import { spawn } from "node:child_process"

import { PATHS, ensurePaths } from "./lib/paths"
import { state } from "./lib/state"
import { setupGitHubToken } from "./lib/token"

interface RunAuthOptions {
  verbose: boolean
  showToken: boolean
  autoStart: boolean
}

export async function runAuth(options: RunAuthOptions): Promise<void> {
  if (options.verbose) {
    consola.level = 5
    consola.info("Verbose logging enabled")
  }

  state.showToken = options.showToken

  await ensurePaths()
  await setupGitHubToken({ force: true })
  consola.success("GitHub token written to", PATHS.GITHUB_TOKEN_PATH)

  if (options.autoStart) {
    const child = spawn(process.execPath, [process.argv[1], "start"], {
      detached: true,
      stdio: "ignore",
      env: { ...process.env, NODE_ENV: "production" },
    })
    child.unref()
    consola.success("Server started in background (port 4141)")
  }
}

export const auth = defineCommand({
  meta: {
    name: "auth",
    description: "Run GitHub auth flow without running the server",
  },
  args: {
    verbose: {
      alias: "v",
      type: "boolean",
      default: false,
      description: "Enable verbose logging",
    },
    "show-token": {
      type: "boolean",
      default: false,
      description: "Show GitHub token on auth",
    },
    "auto-start": {
      type: "boolean",
      default: false,
      description: "Automatically start the server in background after login",
    },
  },
  run({ args }) {
    return runAuth({
      verbose: args.verbose,
      showToken: args["show-token"],
      autoStart: args["auto-start"],
    })
  },
})

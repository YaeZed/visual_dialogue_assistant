import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const frontendDir = path.join(rootDir, "frontend");
const viteBin = path.join(rootDir, "node_modules", "vite", "bin", "vite.js");
const args = new Set(process.argv.slice(2));
const env = {
  ...process.env,
  ...loadDotEnv(path.join(rootDir, ".env")),
};
let isShuttingDown = false;

const frontendHost = args.has("--https") ? "0.0.0.0" : "127.0.0.1";

if (args.has("--https")) {
  env.VITE_DEV_HTTPS = "true";
}

const childConfigs = [
  {
    name: "backend",
    command: process.execPath,
    args: [path.join(rootDir, "backend", "server.mjs")],
    cwd: rootDir,
  },
  {
    name: "frontend",
    command: process.execPath,
    args: [viteBin, "--host", frontendHost],
    cwd: frontendDir,
  },
];

const children = childConfigs.map((config) => {
  const child = spawn(config.command, config.args, {
    cwd: config.cwd,
    env,
    stdio: ["inherit", "pipe", "pipe"],
  });

  prefixOutput(config.name, child.stdout);
  prefixOutput(config.name, child.stderr);

  child.on("exit", (code, signal) => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;
    stopChildren(child.pid);

    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 1);
  });

  return child;
});

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

function loadDotEnv(filePath) {
  try {
    const content = readFileSync(filePath, "utf8");
    const values = {};

    for (const line of content.split(/\r?\n/)) {
      const trimmedLine = line.trim();

      if (!trimmedLine || trimmedLine.startsWith("#")) {
        continue;
      }

      const separatorIndex = trimmedLine.indexOf("=");

      if (separatorIndex === -1) {
        continue;
      }

      const key = trimmedLine.slice(0, separatorIndex).trim();
      const rawValue = trimmedLine.slice(separatorIndex + 1).trim();

      if (key) {
        values[key] = rawValue.replace(/^["']|["']$/g, "");
      }
    }

    return values;
  } catch (error) {
    if (error?.code === "ENOENT") {
      return {};
    }

    throw error;
  }
}

function prefixOutput(name, stream) {
  const reader = readline.createInterface({ input: stream });

  reader.on("line", (line) => {
    console.log(`[${name}] ${line}`);
  });
}

function shutdown(signal) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  stopChildren();

  setTimeout(() => process.exit(0), 300);
}

function stopChildren(exceptPid) {
  for (const child of children) {
    if (!child.killed && child.pid !== exceptPid) {
      child.kill();
    }
  }
}

import { spawn } from "child_process";

const scriptPath = __dirname + "../../../../../apps/cli/bin/index.js";

/**
 * Executes a command in the CLI with given arguments.
 * @param {string} command - The command and its arguments as a single string.
 * @returns {Promise<string>} - Resolves with the output of the command or rejects on failure.
 */
export function runCliCommand(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const args = command.split(" ");
    const child = spawn("node", [scriptPath, ...args], { stdio: "pipe" });

    let output = "";
    let errorOutput = "";

    child.stdout.on("data", data => {
      output += data.toString();
    });

    child.stderr.on("data", data => {
      errorOutput += data.toString();
    });

    child.on("exit", code => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`CLI command failed with exit code ${code}: ${errorOutput}`));
      }
    });

    child.on("error", error => {
      reject(new Error(`Error executing CLI command: ${error.message}`));
    });
  });
}

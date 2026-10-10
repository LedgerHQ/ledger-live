import { createInterface } from "node:readline";
import { isInteractive } from "../shared/ui";

/** Whether a person can answer a prompt: stdin and stderr are terminals and no AI agent runs us. */
export function canAskToConfirm(): boolean {
  return isInteractive() && process.stdin.isTTY === true;
}

/** Anything but y/yes is a no, and so are Ctrl+C and Ctrl+D. */
export async function askToConfirm(question: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  return new Promise<boolean>(resolve => {
    rl.on("close", () => resolve(false));
    rl.question(question, answer => {
      resolve(/^y(es)?$/i.test(answer.trim()));
      rl.close();
    });
  });
}

import { createInterface } from "node:readline";
import { isInteractive } from "../shared/ui";

/** Whether a person can answer a prompt: stdin and stderr are terminals and no AI agent runs us. */
export function canAskToConfirm(): boolean {
  return isInteractive() && process.stdin.isTTY === true;
}

/** Asks `question` on stderr and reads a yes/no answer from stdin; anything but y/yes is a no. */
export async function askToConfirm(question: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  const answer = await new Promise<string>(resolve => {
    rl.question(question, value => {
      rl.close();
      resolve(value);
    });
  });
  return /^y(es)?$/i.test(answer.trim());
}

import { createInterface } from "node:readline";
import { createTestSeam } from "../shared/test-seam";
import { isInteractive } from "../shared/ui";

/** Asks the person at the terminal a yes/no question. */
export type ConfirmPrompt = {
  canAsk: () => boolean;
  ask: (question: string) => Promise<boolean>;
};

const terminalPrompt: ConfirmPrompt = {
  canAsk: () => isInteractive() && process.stdin.isTTY === true,
  ask: question => {
    const rl = createInterface({ input: process.stdin, output: process.stderr });
    return new Promise<boolean>(resolve => {
      rl.on("close", () => resolve(false));
      rl.question(question, answer => {
        resolve(/^y(es)?$/i.test(answer.trim()));
        rl.close();
      });
    });
  },
};
const prompt = createTestSeam(terminalPrompt);

/** @internal Test seam — answers prompts without a terminal; `null` restores the terminal. */
export const _setTestConfirmPrompt = prompt.set;

/** Whether a person can answer a prompt: stdin and stderr are terminals and no AI agent runs us. */
export function canAskToConfirm(): boolean {
  return prompt.get().canAsk();
}

/** Anything but y/yes is a no, and so are Ctrl+C and Ctrl+D. */
export function askToConfirm(question: string): Promise<boolean> {
  return prompt.get().ask(question);
}

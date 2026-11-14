import type { ConfirmPrompt } from "../agent-intent/confirm-prompt";

/** Prompt for `_setTestConfirmPrompt`: a person who answers `answer` to every question asked. */
export class FakeConfirmPrompt implements ConfirmPrompt {
  readonly questions: string[] = [];

  constructor(public answer: boolean) {}

  readonly canAsk = () => true;

  readonly ask = (question: string) => {
    this.questions.push(question);
    return Promise.resolve(this.answer);
  };
}

import type { Spinner } from "yocto-spinner";

export class FakeSpinner {
  isSpinning = false;

  constructor(public text: string) {}

  start(): this {
    this.isSpinning = true;
    return this;
  }

  stop(): this {
    this.isSpinning = false;
    return this;
  }

  success(text?: string): this {
    return this.#finish(text);
  }

  error(text?: string): this {
    return this.#finish(text);
  }

  clear(): this {
    return this;
  }

  #finish(text: string | undefined): this {
    if (text) this.text = text;
    this.isSpinning = false;
    return this;
  }
}

/** Spinner factory for `_setTestSpinner` that records what it creates and draws nothing. */
export class FakeSpinners {
  readonly created: FakeSpinner[] = [];

  readonly create = (text: string): Spinner => {
    const spin = new FakeSpinner(text);
    this.created.push(spin);
    return spin as unknown as Spinner;
  };
}

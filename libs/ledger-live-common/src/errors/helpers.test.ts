import { extractErrorContext } from "./helpers";

class CircularError extends Error {
  private _cause: Error | undefined;

  constructor(message: string) {
    super(message);
    super.name = "CircularError";
  }

  get cause(): Error | undefined {
    return this._cause;
  }

  set cause(cause: Error) {
    this._cause = cause;
  }
}

type ExampleErrorParams = {
  id: string;
  count: number;
  logs: string[];
  subContext: Record<string, unknown>;
  flagged: boolean;
};

// Example error with different attribute parameter for test
class ExampleError extends Error {
  private id: string;
  private count: number;
  private logs: string[];
  private subContext: Record<string, unknown>;
  private flagged: boolean;

  constructor(message: string, { id, count, logs, subContext, flagged }: ExampleErrorParams) {
    super(message);
    super.name = "ExampleError";
    this.id = id;
    this.count = count;
    this.logs = [...logs];
    this.subContext = { ...subContext };
    this.flagged = flagged;
  }
}

const DEFAULT_MESSAGE = "Example circular error, should not be used for production";

const DEFAULT_EXPECTED_CONTEXT = {
  message: DEFAULT_MESSAGE,
  name: "CircularError",
  stack: expect.any(String),
};

describe("extractErrorContext", () => {
  it("should not include Circular reference", () => {
    const error = new CircularError(DEFAULT_MESSAGE);
    error.cause = error;

    expect(extractErrorContext(error)).toEqual(DEFAULT_EXPECTED_CONTEXT);
  });

  it("should include additional attributes of error", () => {
    const message = "Example error, should not be used in production";
    const error = new ExampleError(message, {
      id: "0",
      count: 1,
      logs: ["instruction 1", "instruction 2"],
      subContext: { id: "1" },
      flagged: true,
    });

    expect(extractErrorContext(error)).toEqual({
      name: "ExampleError",
      message,
      stack: expect.any(String),
      id: "0",
      count: 1,
      logs: {
        "0": "instruction 1",
        "1": "instruction 2",
      },
      subContext: {
        id: "1",
      },
      flagged: true,
    });
  });
});

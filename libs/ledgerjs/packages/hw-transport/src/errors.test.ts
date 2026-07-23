import { TransportError, TransportRaceCondition } from "./errors";
import { TransportError as ReexportedTransportError } from "./Transport";

describe("TransportError", () => {
  test("has the expected name, message and id", () => {
    const error = new TransportError("something went wrong", "SomeId");

    expect(error.name).toEqual("TransportError");
    expect(error.message).toEqual("something went wrong");
    expect(error.id).toEqual("SomeId");
  });

  test("falls back to the class name when message is empty", () => {
    const error = new TransportError("", "SomeId");

    expect(error.message).toEqual("");
    expect(error.stack).toContain("TransportError");
  });

  test("is an instance of Error and TransportError", () => {
    const error = new TransportError("boom", "SomeId");

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(TransportError);
  });

  test("is the same class re-exported from Transport", () => {
    expect(ReexportedTransportError).toBe(TransportError);
  });
});

describe("TransportRaceCondition", () => {
  test("uses the provided message", () => {
    const error = new TransportRaceCondition("race!");

    expect(error.name).toEqual("TransportRaceCondition");
    expect(error.message).toEqual("race!");
  });

  test("falls back to the class name when no message is provided", () => {
    const error = new TransportRaceCondition();

    expect(error.message).toEqual("TransportRaceCondition");
  });

  test("is an instance of Error and TransportRaceCondition", () => {
    const error = new TransportRaceCondition();

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(TransportRaceCondition);
  });
});

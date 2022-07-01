import { AmountRequired } from "@ledgerhq/errors";

function functionA() {
  throw new AmountRequired();
}

describe("custom errors", () => {
  test("error instanceof", () => {
    try {
      functionA();
    } catch (e: any) {
      expect(e).toBeInstanceOf(AmountRequired);
    }
  });

  test("promise error instanceof", () => {
    expect(Promise.reject(new AmountRequired())).rejects.toBeInstanceOf(
      AmountRequired
    );
  });
});

import { UnsupportedDerivation } from "./errors";

function functionA() {
  throw new UnsupportedDerivation();
}

describe("custom errors", () => {
  test("error instanceof", () => {
    try {
      functionA();
    } catch (e: any) {
      expect(e).toBeInstanceOf(UnsupportedDerivation);
    }
  });

  test("promise error instanceof", () => {
    expect(Promise.reject(new UnsupportedDerivation())).rejects.toBeInstanceOf(
      UnsupportedDerivation
    );
  });
});

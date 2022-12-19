import { AccessDeniedError } from "./errors";

function functionA() {
  throw new AccessDeniedError();
}

describe("custom errors", () => {
  test("error instanceof", () => {
    try {
      functionA();
    } catch (e: any) {
      expect(e).toBeInstanceOf(AccessDeniedError);
    }
  });

  test("promise error instanceof", () => {
    expect(Promise.reject(new AccessDeniedError())).rejects.toBeInstanceOf(
      AccessDeniedError
    );
  });
});

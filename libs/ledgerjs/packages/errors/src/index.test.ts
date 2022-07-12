import { AmountRequired } from "./index";

function functionA() {
  throw new AmountRequired();
}

describe("custom errors", () => {
  test("error name", () => {
    try {
      functionA();
    } catch (e: any) {
      expect(e.name).toEqual("AmountRequired");
    }
  });

  test("error is correctly located at the functionA", () => {
    try {
      functionA();
    } catch (e: any) {
      const i = e.stack.indexOf("functionA");
      expect(e.stack.slice(0, i + 9)).toEqual(
        `AmountRequired: AmountRequired
    at functionA`
      );
    }
  });

  test("error with custom message", () => {
    try {
      throw new AmountRequired("YO");
    } catch (e: any) {
      expect(e.message).toEqual("YO");
    }
  });

  test("error with custom fields", () => {
    try {
      throw new AmountRequired("YO", { foo: 42 });
    } catch (e: any) {
      expect(e.foo).toEqual(42);
    }
  });

  test("error.cause", () => {
    try {
      functionA();
    } catch (cause: any) {
      try {
        throw new AmountRequired("YO", { foo: 42 }, { cause });
      } catch (e: any) {
        expect(e.cause).toMatchObject(new AmountRequired());
      }
    }
  });

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

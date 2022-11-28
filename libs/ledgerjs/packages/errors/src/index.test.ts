import { AmountRequired, CurrencyNotSupported } from "./index";

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
      throw new CurrencyNotSupported("YO", { currencyName: "foo" });
    } catch (e: any) {
      expect(
        // FIXME it's not yet the good type here
        e instanceof CurrencyNotSupported && (e as any).currencyName
      ).toEqual("foo");
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

  test("error is instance of Error", () => {
    const error: Error = new AmountRequired();
    expect(error instanceof Error).toBeTruthy();
  });
});

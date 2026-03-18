import { botTest, getContext } from "./bot-test-context";
import { formatError } from "./formatters";

describe("test the botTest context itself", () => {
  test("botTest", () => {
    const f = () => {
      try {
        botTest("CTX", () => expect(true).toEqual(false));
      } catch (e) {
        return getContext(e);
      }
    };
    expect(f()).toEqual("CTX");
  });

  test("double botTest", () => {
    const f = () => {
      try {
        botTest("1", () => botTest("2", () => expect(true).toEqual(false)));
      } catch (e) {
        return getContext(e);
      }
    };
    expect(f()).toEqual("1 > 2");
  });

  test("formatError", () => {
    const f = () => {
      try {
        botTest("CTX", () => expect(true).toEqual(false));
      } catch (e) {
        return formatError(e);
      }
    };
    expect(f()?.slice(0, 8)).toEqual("TEST CTX");
  });
});

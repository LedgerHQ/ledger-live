import { generateCallbackId } from "../callbackIdGenerator";

describe("callbackIdGenerator", () => {
  it("returns a string prefixed with callback_", () => {
    const id = generateCallbackId();
    expect(id).toMatch(/^callback_.*$/);
    expect(typeof id).toBe("string");
  });

  it("returns unique ids on each call", () => {
    const id1 = generateCallbackId();
    const id2 = generateCallbackId();
    expect(id1).not.toBe(id2);
  });
});

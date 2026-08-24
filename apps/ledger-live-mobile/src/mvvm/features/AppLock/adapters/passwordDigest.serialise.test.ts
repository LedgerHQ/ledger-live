import { serialiseDerivation } from "./passwordDigest";

jest.mock("react-native-fast-crypto", () => ({ scrypt: jest.fn(), secp256k1: {} }));

async function hasSettled(promise: Promise<unknown>): Promise<boolean> {
  let settled = false;
  promise.then(
    () => {
      settled = true;
    },
    () => {
      settled = true;
    },
  );

  for (let i = 0; i < 50; i += 1) {
    await Promise.resolve();
  }

  return settled;
}

describe("serialiseDerivation", () => {
  it("runs one derivation at a time", async () => {
    const order: string[] = [];
    let release = () => {};
    const gate = new Promise<void>(resolve => {
      release = resolve;
    });

    const first = serialiseDerivation(async () => {
      order.push("first:start");
      await gate;
      order.push("first:end");
    });
    const second = serialiseDerivation(async () => {
      order.push("second:start");
    });

    await Promise.resolve();
    await Promise.resolve();
    expect(order).toEqual(["first:start"]);

    release();
    await Promise.all([first, second]);

    expect(order).toEqual(["first:start", "first:end", "second:start"]);
  });

  it("survives a nested call, because migration verifies inside its own run", async () => {
    const nested = serialiseDerivation(async () => {
      await serialiseDerivation(async () => "inner");
      return "outer";
    });

    await expect(hasSettled(nested)).resolves.toBe(true);
    await expect(nested).resolves.toBe("outer");
  });
});

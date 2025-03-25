import { buildTransaction } from "./buildTransaction";
import { createFixtureAccount, createFixtureTransaction } from "../types/bridge.fixture";

describe("buildTransaction", () => {
  it("returns unsigned tx bytes for given tx", async () => {
    // GIVEN
    const account = createFixtureAccount();
    const transaction = createFixtureTransaction();

    // WHEN
    const result = await buildTransaction(account, transaction);

    // THEN
    expect(result).not.toBeNull();
    expect(result.unsigned).toBeInstanceOf(Uint8Array);
  });
});

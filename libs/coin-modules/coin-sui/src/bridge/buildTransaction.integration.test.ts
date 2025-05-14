import { buildTransaction } from "./buildTransaction";
import { createFixtureAccount, createFixtureTransaction } from "../types/bridge.fixture";
import { getFullnodeUrl } from "@mysten/sui/client";
import coinConfig from "../config";

describe("buildTransaction", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      status: {
        type: "active",
      },
      node: {
        url: getFullnodeUrl("mainnet"),
      },
    }));
  });
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

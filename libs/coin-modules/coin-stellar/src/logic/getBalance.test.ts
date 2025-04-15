import coinConfig, { StellarCoinConfig } from "../config";
import { getBalance } from "./getBalance";
import { AccountCallBuilder } from "@stellar/stellar-sdk/lib/horizon/account_call_builder";

describe("getBalance", () => {
  coinConfig.setCoinConfig(
    () =>
      ({
        status: { type: "active" },
        explorer: { url: "https://stellar.explorer.com" },
      }) as unknown as StellarCoinConfig,
  );
  it("gets the balance of a Stellar account", async () => {
    jest.spyOn(AccountCallBuilder.prototype, "accountId").mockReturnValue({
      call: () => Promise.resolve({ balances: [{ asset_type: "native", balance: "50" }] }),
    } as any);

    expect(await getBalance("GC65CUPW2IMTJJY6CII7F3OBPVG4YGASEPBBLM4V3LBKX62P6LA24OFV")).toEqual([
      { value: BigInt(500000000), asset: { type: "native" } },
    ]);
  });
});

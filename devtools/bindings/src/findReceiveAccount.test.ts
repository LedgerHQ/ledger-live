import { findReceiveAccount } from "./findReceiveAccount";

const usdc = { id: "eth+usdc", token: { id: "ethereum/erc20/usd__coin" } };
const eth = { id: "eth", subAccounts: [usdc] };
const btc = { id: "btc" };

describe("findReceiveAccount", () => {
  it("finds the main account of its coin", () => {
    expect(findReceiveAccount([btc, eth], { legacyAccountId: "eth", assetId: "ethereum" })).toEqual(
      { account: eth },
    );
  });

  it("finds the token account with its parent", () => {
    expect(
      findReceiveAccount([btc, eth], {
        legacyAccountId: "eth",
        assetId: "ethereum/erc20/usd__coin",
      }),
    ).toEqual({ account: usdc, parentAccount: eth });
  });

  it("finds nothing for an unknown account", () => {
    expect(
      findReceiveAccount([btc, eth], { legacyAccountId: "sol", assetId: "solana" }),
    ).toBeUndefined();
  });
});

import {
  AccountAliasSchema,
  computeAccountAlias,
  initialAccountAliasState,
  AccountAliasStateSchema,
} from "./schema";

const BTC_ACCOUNT_ID = "js:2:bitcoin:xpub6DEHKg8fgKcb5iYGPLtpBYD9gm7nvym3wwhH:segwit";
const ETH_ACCOUNT_ID = "js:2:ethereum:0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3:";

describe("computeAccountAlias", () => {
  it("returns a uuid", () => {
    expect(AccountAliasSchema.safeParse(computeAccountAlias(BTC_ACCOUNT_ID)).success).toBe(true);
  });

  it("is deterministic", () => {
    expect(computeAccountAlias(BTC_ACCOUNT_ID)).toBe(computeAccountAlias(BTC_ACCOUNT_ID));
  });

  it("gives different aliases to different accounts", () => {
    expect(computeAccountAlias(BTC_ACCOUNT_ID)).not.toBe(computeAccountAlias(ETH_ACCOUNT_ID));
  });

  it("leaks no part of the account id", () => {
    const alias: string = computeAccountAlias(BTC_ACCOUNT_ID);
    expect(alias).not.toContain("xpub");
    expect(alias).not.toContain("bitcoin");
    expect(alias).not.toMatch(/[/+:]/);
  });

  it("aliases token account ids, slashes and all", () => {
    const tokenAccountId = `${ETH_ACCOUNT_ID}+ethereum/erc20/usd__coin`;
    expect(AccountAliasSchema.safeParse(computeAccountAlias(tokenAccountId)).success).toBe(true);
  });
});

describe("AccountAliasStateSchema", () => {
  it("accepts the initial state", () => {
    expect(AccountAliasStateSchema.safeParse(initialAccountAliasState).success).toBe(true);
  });

  it("accepts a populated reverse map", () => {
    const state = { accountIdByAlias: { [computeAccountAlias(BTC_ACCOUNT_ID)]: BTC_ACCOUNT_ID } };
    expect(AccountAliasStateSchema.safeParse(state).success).toBe(true);
  });

  it("rejects a non-string entry", () => {
    const state = { accountIdByAlias: { [computeAccountAlias(BTC_ACCOUNT_ID)]: 42 } };
    expect(AccountAliasStateSchema.safeParse(state).success).toBe(false);
  });
});

import { parseAnyAccountId } from "@domain/entity-account";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import {
  AccountAliasSchema,
  computeAccountAlias,
  computeAccountId,
  initialAccountAliasState,
  AccountAliasStateSchema,
} from "./schema";

const BTC_ACCOUNT_ID = "js:2:bitcoin:xpub6DEHKg8fgKcb5iYGPLtpBYD9gm7nvym3wwhH:segwit";
const ETH_ACCOUNT_ID = "js:2:ethereum:0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3:";
const btcId = parseAnyAccountId(BTC_ACCOUNT_ID);
const ethId = parseAnyAccountId(ETH_ACCOUNT_ID);

describe("computeAccountAlias", () => {
  it("returns a uuid", () => {
    expect(AccountAliasSchema.safeParse(computeAccountAlias(btcId)).success).toBe(true);
  });

  it("is deterministic", () => {
    expect(computeAccountAlias(btcId)).toBe(computeAccountAlias(btcId));
  });

  it("gives different aliases to different accounts", () => {
    expect(computeAccountAlias(btcId)).not.toBe(computeAccountAlias(ethId));
  });

  it("leaks no part of the account id", () => {
    const alias: string = computeAccountAlias(btcId);
    expect(alias).not.toContain("xpub");
    expect(alias).not.toContain("bitcoin");
    expect(alias).not.toMatch(/[/+:]/);
  });

  it("aliases token account ids, slashes and all", () => {
    const tokenAccountId = parseAnyAccountId(`${ETH_ACCOUNT_ID}+ethereum/erc20/usd__coin`);
    expect(AccountAliasSchema.safeParse(computeAccountAlias(tokenAccountId)).success).toBe(true);
  });
});

describe("AccountAliasStateSchema", () => {
  it("accepts the initial state", () => {
    expect(AccountAliasStateSchema.safeParse(initialAccountAliasState).success).toBe(true);
  });

  it("accepts a populated reverse map", () => {
    const state = { accountIdByAlias: { [computeAccountAlias(btcId)]: BTC_ACCOUNT_ID } };
    expect(AccountAliasStateSchema.safeParse(state).success).toBe(true);
  });

  it("rejects a non-string entry", () => {
    const state = { accountIdByAlias: { [computeAccountAlias(btcId)]: 42 } };
    expect(AccountAliasStateSchema.safeParse(state).success).toBe(false);
  });
});

describe("computeAccountId", () => {
  const descriptor: AccountDescriptor = {
    purpose: "account",
    version: "1",
    type: "address",
    network: { name: "ethereum", env: "main" },
    address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    path: "m/44h/60h/0h/0/0",
  };

  it("is deterministic and carries neither address nor path", () => {
    const id = computeAccountId(descriptor);
    expect(computeAccountId({ ...descriptor })).toBe(id);
    expect(id).not.toContain("0x71C7");
    expect(id).not.toContain("+");
  });

  it("differs when any part of the descriptor differs", () => {
    const id = computeAccountId(descriptor);
    expect(computeAccountId({ ...descriptor, path: "m/44h/60h/1h/0/0" })).not.toBe(id);
    expect(
      computeAccountId({ ...descriptor, network: { name: "ethereum", env: "sepolia" } }),
    ).not.toBe(id);
  });
});

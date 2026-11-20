import {
  LegacyAccountEntrySchema,
  accountsSlice,
  legacyAccountsSynced,
} from "@domain/entity-account";
import { mockAccountEntry } from "@domain/entity-account/schema.mock";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import { toReceiveTarget } from "../toReceiveTarget";

const ETH_ACCOUNT_ID = "js:2:ethereum:0x71C7656EC7ab88b098defB751B7401B5f6d8976F:";
const USDC_ACCOUNT_ID = `${ETH_ACCOUNT_ID}+ethereum%2Ferc20%2Fusd__coin`;
const ETHEREUM = CryptoOrTokenCurrencyIdSchema.parse("ethereum");
const USDC = CryptoOrTokenCurrencyIdSchema.parse("ethereum/erc20/usd__coin");

const ethEntry = LegacyAccountEntrySchema.parse(mockAccountEntry());
const accounts = accountsSlice.reducer(undefined, legacyAccountsSynced([ethEntry]));

describe("toReceiveTarget", () => {
  it("targets the account and the given asset", () => {
    expect(toReceiveTarget(accounts, ETH_ACCOUNT_ID, ETHEREUM)).toEqual({
      accountUUID: ethEntry.accountUUID,
      descriptor: ethEntry.descriptor,
      assetId: ETHEREUM,
    });
  });

  it("targets another asset of the same account", () => {
    expect(toReceiveTarget(accounts, ETH_ACCOUNT_ID, USDC)?.assetId).toBe(USDC);
  });

  it("returns undefined for a token account id, which is not a main account id", () => {
    expect(toReceiveTarget(accounts, USDC_ACCOUNT_ID, USDC)).toBeUndefined();
  });

  it("returns undefined when the account model does not hold the account", () => {
    expect(
      toReceiveTarget(accounts, "js:2:bitcoin:xpub-unknown:native_segwit", ETHEREUM),
    ).toBeUndefined();
  });
});

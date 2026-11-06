import BigNumber from "bignumber.js";
import { mockAccountEntry } from "@domain/entity-account/schema.mock";
import { mockAccountAssetBalance } from "@domain/entity-account-balance/schema.mock";
import { mockAccountReceive } from "@domain/entity-account-receive/schema.mock";
import { mockUtxoAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { toWalletAPIAccounts, type WalletAPIAccountInputs } from "./toWalletAPIAccounts";
import { walletApiIdOf } from "./walletApiAccountId";

const LEGACY_ID = "js:2:ethereum:0x71C7656EC7ab88b098defB751B7401B5f6d8976F:";
const USDC = "ethereum/erc20/usd__coin";
const tokensOnly = (currencyId: string) => currencyId !== "ethereum";

function inputs(overrides: Partial<WalletAPIAccountInputs> = {}): WalletAPIAccountInputs {
  return {
    entry: mockAccountEntry(),
    name: "Ethereum 1",
    balances: [
      mockAccountAssetBalance({ assetId: "ethereum", balance: "100", spendableBalance: "90" }),
      mockAccountAssetBalance({ assetId: USDC, balance: "25000000", spendableBalance: "25000000" }),
    ],
    receive: mockAccountReceive(),
    readAt: Date.UTC(2026, 10, 6),
    tickers: { [USDC]: "USDC" },
    ...overrides,
  };
}

describe("toWalletAPIAccounts", () => {
  it("should keep the id live-common derives from the legacy id, so live apps keep their stored ids", () => {
    const [account] = toWalletAPIAccounts(inputs());
    expect(account.id).toBe("4a8310d2-4f5a-5fc8-8a04-8ced97fc9c22");
  });

  it("should build the account from the entities", () => {
    const [account] = toWalletAPIAccounts(inputs());
    expect(account).toEqual({
      id: walletApiIdOf(LEGACY_ID),
      name: "Ethereum 1",
      address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
      currency: "ethereum",
      balance: new BigNumber(100),
      spendableBalance: new BigNumber(90),
      blockHeight: undefined,
      lastSyncDate: new Date(Date.UTC(2026, 10, 6)),
    });
  });

  it("should make each token row a token account under its parent, with the legacy token account id", () => {
    const [parent, token] = toWalletAPIAccounts(inputs());
    expect(token).toMatchObject({
      id: walletApiIdOf(`${LEGACY_ID}+ethereum%2Ferc20%2Fusd~!underscore!~~!underscore!~coin`),
      parentAccountId: parent.id,
      name: "Ethereum 1 (USDC)",
      currency: USDC,
      address: parent.address,
      balance: new BigNumber(25000000),
    });
  });

  it("should name a token by its id when its ticker is unknown", () => {
    const [, token] = toWalletAPIAccounts(inputs({ tickers: {} }));
    expect(token.name).toBe(`Ethereum 1 (${USDC})`);
  });

  it("should only keep the accounts the filter allows", () => {
    expect(toWalletAPIAccounts(inputs(), tokensOnly).map(a => a.currency)).toEqual([USDC]);
  });

  it("should take the receive address over the descriptor's", () => {
    const [account] = toWalletAPIAccounts(
      inputs({ receive: mockAccountReceive({ address: "0xabc" }) }),
    );
    expect(account.address).toBe("0xabc");
  });

  it("should not be ready while its onboarding is required", () => {
    const [account] = toWalletAPIAccounts(inputs({ receive: { status: "onboardingRequired" } }));
    expect(account.readiness).toEqual({ ready: false, reason: "activationRequired" });
  });

  it("should have no address for a utxo account not read yet", () => {
    const descriptor = mockUtxoAccountDescriptor();
    const entry = mockAccountEntry({ descriptor, legacyId: undefined });
    const [account] = toWalletAPIAccounts(
      inputs({ entry, balances: [], receive: undefined, readAt: undefined }),
    );
    expect(account).toMatchObject({
      id: walletApiIdOf(computeAccountUUID(descriptor)),
      address: "",
      currency: "bitcoin",
      balance: new BigNumber(0),
      lastSyncDate: new Date(0),
    });
  });
});

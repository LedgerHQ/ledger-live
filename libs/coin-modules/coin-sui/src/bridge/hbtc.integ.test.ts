import assert from "assert";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { Transaction } from "@mysten/sui/transactions";
import BigNumber from "bignumber.js";
import coinConfig from "../config";
import type { SuiCoinConfig, SuiTransport } from "../config";
import { createTransaction, getAccountBalances } from "../network";
import {
  HBTC_COIN_TYPE,
  HBTC_DEPOSIT,
  HBTC_HOLDER,
  HBTC_TOKEN,
  STAKE_DELEGATOR,
} from "../test/fixtures";
import { toLongStructTag, toShortStructTag } from "../utils";
import { getAccountShape } from "./synchronisation";

// hBTC reaches the holder through the SIP-58 address balance, never as a coin object, so every
// assertion below runs through the address-balance branches. Each transport implements those
// branches separately, hence the same suite on both.

const configFor = (transport: SuiTransport): SuiCoinConfig => ({
  status: { type: "active" },
  node: {
    graphqlUrl: "https://sui.coin.ledger.com/graphql",
    grpcUrl: "https://sui.coin.ledger.com",
  },
  features: { transport },
  name: "Sui",
  unit: { name: "Sui", code: "SUI", magnitude: 9 },
});

const SHAPE_INFO = {
  index: 0,
  derivationPath: "44'/784'/0'/0'/0'",
  currency: getCryptoCurrencyById("sui"),
  address: HBTC_HOLDER,
  initialAccount: undefined,
  derivationMode: "sui" as const,
};

const SYNC_CONFIG = { blacklistedTokenIds: [], paginationConfig: {} };

beforeAll(() => {
  // The hBTC token is not in the crypto-assets list yet: serve the local entry.
  setCryptoAssetsStore({
    findTokenByAddressInCurrency: async (address: string, currencyId: string) =>
      currencyId === "sui" && address === toLongStructTag(HBTC_COIN_TYPE) ? HBTC_TOKEN : undefined,
    findTokenById: async () => undefined,
    getTokensSyncHash: async () => "0",
  });
});

describe.each<SuiTransport>(["grpc", "graphql"])(
  "hBTC held in the address balance (%s)",
  transport => {
    const config = configFor(transport);

    beforeAll(() => {
      // The bridge reads its config from the module store rather than from an argument.
      coinConfig.setCoinConfig(() => config);
    });

    it("reports a non-zero hBTC balance held entirely in the address balance", async () => {
      const balances = await getAccountBalances(config, HBTC_HOLDER);

      const hbtc = balances.find(b => b.coinType === toShortStructTag(HBTC_COIN_TYPE));
      assert(hbtc, "no hBTC balance");
      expect(hbtc.balance.gt(0)).toBe(true);
      // No hBTC coin object: the whole balance is the address-balance share.
      expect(hbtc.fundsInAddressBalance.toFixed()).toBe(hbtc.balance.toFixed());
    });

    it("builds an hBTC sub-account with the balance and the incoming deposit", async () => {
      const shape = await getAccountShape(SHAPE_INFO, SYNC_CONFIG);

      const subAccount = shape.subAccounts?.find(
        sub => sub.type === "TokenAccount" && sub.token.id === HBTC_TOKEN.id,
      );
      assert(subAccount, "no hBTC sub-account");
      expect(subAccount.balance.gt(0)).toBe(true);

      const deposit = subAccount.operations.find(op => op.hash === HBTC_DEPOSIT.digest);
      assert(deposit, "no hBTC deposit operation");
      expect(deposit).toMatchObject({ type: "IN", accountId: subAccount.id });
      expect(deposit.value.toFixed()).toBe(HBTC_DEPOSIT.amount);
    }, 240_000);

    it("crafts an hBTC transfer that withdraws from the address balance", async () => {
      const { unsigned } = await createTransaction(config, HBTC_HOLDER, {
        mode: "token.send",
        coinType: HBTC_COIN_TYPE,
        amount: new BigNumber(1000),
        recipient: STAKE_DELEGATOR,
      });

      const { inputs } = Transaction.from(unsigned).getData();
      const withdrawals = inputs.filter(input => input.$kind === "FundsWithdrawal");
      expect(withdrawals).toHaveLength(1);
      expect(JSON.stringify(withdrawals[0])).toContain("::btc::BTC");
      // Nothing to merge or split: the account owns no hBTC coin object to put in the inputs.
      expect(inputs.filter(input => input.$kind === "Object")).toEqual([]);
    });
  },
);

import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import { Account } from "@ledgerhq/types-live";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-alpaca/types";
import {
  RECIPIENT,
  SOLANA,
  SOLANA_CWIF,
  SOLANA_USDC,
  SOLANA_VIRTUAL,
  initMSW,
  makeAccount,
} from "../fixtures";
import BigNumber from "bignumber.js";
import { setEnv } from "@ledgerhq/live-env";
import { airdrop, killAgave, spawnAgave } from "../agave";
import { encodeTokenAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import { PAYER, createSplAccount } from "../connection";
import { buildSigner } from "../signer";
import { getBridges } from "../helpers";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";

global.console = require("console");
jest.setTimeout(100_000);

type SolanaScenarioTransaction = ScenarioTransaction<GenericTransaction, Account>;

function makeScenarioTransactions(address: string): SolanaScenarioTransaction[] {
  const scenarioSendSolTransaction: SolanaScenarioTransaction = {
    name: "Send 1 Sol",
    amount: new BigNumber(1e9),
    recipient: RECIPIENT,
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toEqual(1);
      expect(latestOperation.type).toEqual("OUT");
      expect(latestOperation.value).toStrictEqual(latestOperation.fee.plus(1e9));
      expect(latestOperation.senders).toStrictEqual([address]);
      expect(latestOperation.recipients).toStrictEqual([RECIPIENT]);
      expect(currentAccount.balance).toStrictEqual(
        previousAccount.balance.minus(latestOperation.value),
      );
    },
  };

  const parentAccountId = `js:2:solana:${address}:solanaSub`;
  const usdcSubAccountId = encodeTokenAccountId(parentAccountId, SOLANA_USDC);

  const scenarioSendUsdcTransaction: SolanaScenarioTransaction = {
    name: "Send 1 USDC",
    amount: new BigNumber(1e6),
    recipient: RECIPIENT,
    subAccountId: usdcSubAccountId,
    expect: (previousAccount, currentAccount) => {
      expect(currentAccount.operations.length - previousAccount.operations.length).toEqual(1);

      const currentAssociatedTokenAccount = currentAccount.subAccounts?.find(
        sa => sa.id === usdcSubAccountId,
      );
      const previousAssociatedTokenAccount = previousAccount.subAccounts?.find(
        sa => sa.id === usdcSubAccountId,
      );
      const [latestAssociatedTokenAccountOperation] =
        currentAssociatedTokenAccount?.operations ?? [];
      expect(latestAssociatedTokenAccountOperation.type).toEqual("OUT");
      expect(latestAssociatedTokenAccountOperation.value).toStrictEqual(new BigNumber(1e6));
      expect(latestAssociatedTokenAccountOperation.senders).toStrictEqual([address]);
      expect(latestAssociatedTokenAccountOperation.recipients).toStrictEqual([RECIPIENT]);
      expect(currentAssociatedTokenAccount?.balance).toStrictEqual(
        previousAssociatedTokenAccount?.balance.minus(latestAssociatedTokenAccountOperation.value),
      );
    },
  };

  const scenarioSendAllUsdcTransaction: SolanaScenarioTransaction = {
    name: "Send All USDC",
    useAllAmount: true,
    recipient: RECIPIENT,
    subAccountId: usdcSubAccountId,
    expect: (previousAccount, currentAccount) => {
      expect(currentAccount.operations.length - previousAccount.operations.length).toEqual(1);

      const currentAssociatedTokenAccount = currentAccount.subAccounts?.find(
        sa => sa.id === usdcSubAccountId,
      );
      const previousAssociatedTokenAccount = previousAccount.subAccounts?.find(
        sa => sa.id === usdcSubAccountId,
      );
      const [latestAssociatedTokenAccountOperation] =
        currentAssociatedTokenAccount?.operations ?? [];
      expect(latestAssociatedTokenAccountOperation.type).toEqual("OUT");
      expect(latestAssociatedTokenAccountOperation.senders).toStrictEqual([address]);
      expect(latestAssociatedTokenAccountOperation.recipients).toStrictEqual([RECIPIENT]);
      expect(currentAssociatedTokenAccount?.balance).toStrictEqual(
        previousAssociatedTokenAccount?.balance.minus(latestAssociatedTokenAccountOperation.value),
      );
      expect(currentAssociatedTokenAccount?.spendableBalance).toStrictEqual(new BigNumber(0));
    },
  };

  const cwifSubAccountId = encodeTokenAccountId(parentAccountId, SOLANA_CWIF);

  const scenarioSendCwifTransaction: SolanaScenarioTransaction = {
    name: "Send 1 CWIF",
    amount: new BigNumber(1e2),
    recipient: RECIPIENT,
    subAccountId: cwifSubAccountId,
    expect: (previousAccount, currentAccount) => {
      expect(currentAccount.operations.length - previousAccount.operations.length).toEqual(1);

      const currentAssociatedTokenAccount = currentAccount.subAccounts?.find(
        sa => sa.id === cwifSubAccountId,
      );
      const previousAssociatedTokenAccount = previousAccount.subAccounts?.find(
        sa => sa.id === cwifSubAccountId,
      );
      const [latestAssociatedTokenAccountOperation] =
        currentAssociatedTokenAccount?.operations ?? [];
      expect(latestAssociatedTokenAccountOperation.type).toEqual("OUT");
      expect(latestAssociatedTokenAccountOperation.value).toStrictEqual(new BigNumber(1e2 + 5));
      expect(latestAssociatedTokenAccountOperation.senders).toStrictEqual([address]);
      expect(latestAssociatedTokenAccountOperation.recipients).toStrictEqual([RECIPIENT]);
      expect(currentAssociatedTokenAccount?.balance).toStrictEqual(
        previousAssociatedTokenAccount?.balance.minus(latestAssociatedTokenAccountOperation.value),
      );
    },
  };

  const scenarioSendAllCwifTransaction: SolanaScenarioTransaction = {
    name: "Send All CWIF",
    useAllAmount: true,
    recipient: RECIPIENT,
    subAccountId: cwifSubAccountId,
    expect: (previousAccount, currentAccount) => {
      expect(currentAccount.operations.length - previousAccount.operations.length).toEqual(1);

      const currentAssociatedTokenAccount = currentAccount.subAccounts?.find(
        sa => sa.id === cwifSubAccountId,
      );
      const previousAssociatedTokenAccount = previousAccount.subAccounts?.find(
        sa => sa.id === cwifSubAccountId,
      );
      const [latestAssociatedTokenAccountOperation] =
        currentAssociatedTokenAccount?.operations ?? [];
      expect(latestAssociatedTokenAccountOperation.type).toEqual("OUT");
      expect(latestAssociatedTokenAccountOperation.senders).toStrictEqual([address]);
      expect(latestAssociatedTokenAccountOperation.recipients).toStrictEqual([RECIPIENT]);
      expect(currentAssociatedTokenAccount?.balance).toStrictEqual(
        previousAssociatedTokenAccount?.balance.minus(latestAssociatedTokenAccountOperation.value),
      );
    },
  };

  const virtualSubAccountId = encodeTokenAccountId(parentAccountId, SOLANA_VIRTUAL);

  const scenarioSendVirtualTransaction: SolanaScenarioTransaction = {
    name: "Send 1 VIRTUAL",
    amount: new BigNumber(1e9),
    recipient: RECIPIENT,
    subAccountId: virtualSubAccountId,
    expect: (previousAccount, currentAccount) => {
      expect(currentAccount.operations.length - previousAccount.operations.length).toEqual(1);

      const currentAssociatedTokenAccount = currentAccount.subAccounts?.find(
        sa => sa.id === virtualSubAccountId,
      );
      const previousAssociatedTokenAccount = previousAccount.subAccounts?.find(
        sa => sa.id === virtualSubAccountId,
      );
      const [latestAssociatedTokenAccountOperation] =
        currentAssociatedTokenAccount?.operations ?? [];
      expect(latestAssociatedTokenAccountOperation.type).toEqual("OUT");
      expect(latestAssociatedTokenAccountOperation.value).toStrictEqual(new BigNumber(1e9));
      expect(latestAssociatedTokenAccountOperation.senders).toStrictEqual([address]);
      expect(latestAssociatedTokenAccountOperation.recipients).toStrictEqual([RECIPIENT]);
      expect(currentAssociatedTokenAccount?.balance).toStrictEqual(
        previousAssociatedTokenAccount?.balance.minus(latestAssociatedTokenAccountOperation.value),
      );
    },
  };

  const scenarioSendAllVirtualTransaction: SolanaScenarioTransaction = {
    name: "Send All VIRTUAL",
    useAllAmount: true,
    recipient: RECIPIENT,
    subAccountId: virtualSubAccountId,
    expect: (previousAccount, currentAccount) => {
      expect(currentAccount.operations.length - previousAccount.operations.length).toEqual(1);

      const currentAssociatedTokenAccount = currentAccount.subAccounts?.find(
        sa => sa.id === virtualSubAccountId,
      );
      const previousAssociatedTokenAccount = previousAccount.subAccounts?.find(
        sa => sa.id === virtualSubAccountId,
      );
      const [latestAssociatedTokenAccountOperation] =
        currentAssociatedTokenAccount?.operations ?? [];
      expect(latestAssociatedTokenAccountOperation.type).toEqual("OUT");
      expect(latestAssociatedTokenAccountOperation.senders).toStrictEqual([address]);
      expect(latestAssociatedTokenAccountOperation.recipients).toStrictEqual([RECIPIENT]);
      expect(currentAssociatedTokenAccount?.balance).toStrictEqual(
        previousAssociatedTokenAccount?.balance.minus(latestAssociatedTokenAccountOperation.value),
      );
      expect(currentAssociatedTokenAccount?.spendableBalance).toStrictEqual(new BigNumber(0));
    },
  };

  const scenarioSendAllSolTransaction: SolanaScenarioTransaction = {
    name: "Send All Sol",
    useAllAmount: true,
    recipient: RECIPIENT,
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toEqual(1);
      expect(latestOperation.type).toEqual("OUT");
      expect(latestOperation.senders).toStrictEqual([address]);
      expect(latestOperation.recipients).toStrictEqual([RECIPIENT]);
      expect(currentAccount.balance).toStrictEqual(
        previousAccount.balance.minus(latestOperation.value),
      );
      expect(currentAccount.spendableBalance).toStrictEqual(new BigNumber(0));
    },
  };

  // Staking scenarios are commented out: they require Solana-specific transaction model fields
  // (stake.createAccount, stake.delegate, etc.) not yet mapped into GenericTransaction.
  // Follow-up work is needed to support staking via generic-alpaca.

  return [
    scenarioSendSolTransaction,
    scenarioSendUsdcTransaction,
    scenarioSendAllUsdcTransaction,
    scenarioSendCwifTransaction,
    scenarioSendAllCwifTransaction,
    scenarioSendVirtualTransaction,
    scenarioSendAllVirtualTransaction,
    scenarioSendAllSolTransaction,
  ];
}

export const scenarioSolana: Scenario<GenericTransaction, Account> = {
  name: "Ledger Live Basic Solana Transactions",
  setup: async () => {
    await spawnAgave();

    setEnv("API_SOLANA_PROXY", "http://localhost:8899");

    LiveConfig.setConfig({
      config_currency_solana: {
        type: "object",
        default: {
          status: { type: "active" },
          token2022Enabled: true,
          legacyOCMSMaxVersion: "1.8.0",
        },
      },
    });

    const signer = await buildSigner();
    const { accountBridge, currencyBridge, getAddress } = await getBridges(signer);

    const { address } = await getAddress("", {
      path: "44'/501'/0'",
      currency: SOLANA,
      derivationMode: "solanaSub",
    });

    const account = makeAccount(address, SOLANA);

    await airdrop(account.freshAddress, 5);
    await airdrop(PAYER.publicKey.toBase58(), 5);
    await createSplAccount(account.freshAddress, SOLANA_USDC, 5, "spl-token");
    await createSplAccount(account.freshAddress, SOLANA_CWIF, 5, "spl-token-2022");
    await createSplAccount(account.freshAddress, SOLANA_VIRTUAL, 5, "spl-token");

    initMSW();

    return {
      account,
      accountBridge,
      currencyBridge,
    };
  },
  getTransactions: makeScenarioTransactions,
  teardown: killAgave,
};

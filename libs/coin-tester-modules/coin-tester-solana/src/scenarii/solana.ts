import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import { SolanaAccount, Transaction as SolanaTransaction } from "@ledgerhq/coin-solana/types";
import { killSpeculos, spawnSpeculos } from "@ledgerhq/coin-tester/signers/speculos";
import resolver from "@ledgerhq/coin-solana/hw-getAddress";
import { LegacySignerSolana } from "@ledgerhq/live-signer-solana";
import { RECIPIENT, SOLANA, SOLANA_CWIF, SOLANA_USDC, initMSW, makeAccount } from "../fixtures";
import { CoinConfig } from "@ledgerhq/coin-framework/config";
import solanaCoinConfig, { SolanaCoinConfig } from "@ledgerhq/coin-solana/config";
import BigNumber from "bignumber.js";
import { setEnv } from "@ledgerhq/live-env";
import { airdrop, killAgave, spawnAgave } from "../agave";
import { encodeAccountIdWithTokenAccountAddress } from "@ledgerhq/coin-solana/logic";
import { TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { PAYER, createSplAccount } from "../connection";
import { Config, getChainAPI } from "@ledgerhq/coin-solana/network/index";
import { makeBridges } from "@ledgerhq/coin-solana/bridge/bridge";

global.console = require("console");
jest.setTimeout(100_000);

type SolanaScenarioTransaction = ScenarioTransaction<SolanaTransaction, SolanaAccount>;

// Note this config runs with NanoX
// https://github.com/LedgerHQ/ledger-live/blob/develop/libs/coin-tester/docker-compose.yml
export const defaultNanoApp = { firmware: "2.4.2", version: "1.9.1" } as const;

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

  const usdcAssociatedTokenAccountAddress = getAssociatedTokenAddressSync(
    new PublicKey(SOLANA_USDC.contractAddress),
    new PublicKey(address),
  );
  const usdcSubAccountId = encodeAccountIdWithTokenAccountAddress(
    `js:2:solana:${address}:solanaSub`,
    usdcAssociatedTokenAccountAddress.toBase58(),
  );

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

  const cwifAssociatedTokenAccountAddress = getAssociatedTokenAddressSync(
    new PublicKey(SOLANA_CWIF.contractAddress),
    new PublicKey(address),
    undefined,
    TOKEN_2022_PROGRAM_ID,
  );
  const cwifSubAccountId = encodeAccountIdWithTokenAccountAddress(
    `js:2:solana:${address}:solanaSub`,
    cwifAssociatedTokenAccountAddress.toBase58(),
  );

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
      expect(latestAssociatedTokenAccountOperation.value).toStrictEqual(new BigNumber(1e2 + 5)); // amount + transfer fee
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
  return [
    scenarioSendSolTransaction,
    scenarioSendUsdcTransaction,
    scenarioSendAllUsdcTransaction,
    scenarioSendCwifTransaction,
    scenarioSendAllCwifTransaction,
    scenarioSendAllSolTransaction,
  ];
}

export const scenarioSolana: Scenario<SolanaTransaction, SolanaAccount> = {
  name: "Ledger Live Basic Solana Transactions",
  setup: async () => {
    const [{ getOnSpeculosConfirmation, transport }] = await Promise.all([
      spawnSpeculos(`/${defaultNanoApp.firmware}/Solana/app_${defaultNanoApp.version}.elf`),
      spawnAgave(),
    ]);

    const signerContext: Parameters<typeof resolver>[0] = (_, fn) =>
      fn(new LegacySignerSolana(transport));

    const getAddress = resolver(signerContext);
    const { address } = await getAddress("", {
      path: "44'/501'/0'",
      currency: SOLANA,
      derivationMode: "solanaSub",
    });

    const account = makeAccount(address, SOLANA);
    setEnv("API_SOLANA_PROXY", "http://localhost:8899");
    const coinConfig: CoinConfig<SolanaCoinConfig> = () => ({
      status: {
        type: "active",
      },
      token2022Enabled: true,
      queuedInterval: 100,
      legacyOCMSMaxVersion: "1.8.0",
    });
    solanaCoinConfig.setCoinConfig(coinConfig);
    // Make sure the cache is not used, otherwise data is not refreshed frequently
    // enough to work within the context of the coin tester
    const getAPI = (config: Config) => Promise.resolve(getChainAPI(config));
    const { accountBridge, currencyBridge } = makeBridges({
      getAPI,
      getQueuedAPI: getAPI,
      getQueuedAndCachedAPI: getAPI,
      signerContext,
    });

    await airdrop(account.freshAddress, 5);
    await airdrop(PAYER.publicKey.toBase58(), 5);
    await createSplAccount(account.freshAddress, SOLANA_USDC, 5, "spl-token");
    await createSplAccount(account.freshAddress, SOLANA_CWIF, 5, "spl-token-2022");

    initMSW();

    return {
      account,
      accountBridge,
      currencyBridge,
      onSignerConfirmation: getOnSpeculosConfirmation("Approve"),
    };
  },
  getTransactions: makeScenarioTransactions,
  teardown: async () => {
    await Promise.all([killSpeculos(), killAgave()]);
  },
};

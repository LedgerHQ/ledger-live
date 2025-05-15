import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import { SolanaAccount, Transaction as SolanaTransaction } from "@ledgerhq/coin-solana/types";
import { killSpeculos, spawnSpeculos } from "@ledgerhq/coin-tester/signers/speculos";
import resolver from "@ledgerhq/coin-solana/hw-getAddress";
import { LegacySignerSolana } from "@ledgerhq/live-signer-solana";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { makeAccount } from "../fixtures";
import { createBridges } from "@ledgerhq/coin-solana/bridge/js";
import { CoinConfig } from "@ledgerhq/coin-framework/config";
import { SolanaCoinConfig } from "@ledgerhq/coin-solana/config";
import BigNumber from "bignumber.js";
import { setEnv } from "@ledgerhq/live-env";
import { airdrop, killAgave, spawnAgave } from "../agave";

global.console = require("console");
jest.setTimeout(100_000);

type SolanaScenarioTransaction = ScenarioTransaction<SolanaTransaction, SolanaAccount>;

// Note this config runs with NanoX
// https://github.com/LedgerHQ/ledger-live/blob/develop/libs/coin-tester/docker-compose.yml
export const defaultNanoApp = { firmware: "2.4.2", version: "1.8.0" } as const;

function makeScenarioTransactions(address: string): SolanaScenarioTransaction[] {
  const scenarioSendSolTransaction: SolanaScenarioTransaction = {
    name: "Send 1 Sol",
    amount: new BigNumber(1e9),
    recipient: "Hj69wRzkrFuf1Nby4yzPEFHdsmQdMoVYjvDKZSLjZFEp",
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toEqual(1);
      expect(latestOperation.type).toEqual("OUT");
      expect(latestOperation.value).toStrictEqual(latestOperation.fee.plus(1e9));
      expect(latestOperation.senders).toStrictEqual([address]);
      expect(latestOperation.recipients).toStrictEqual([
        "Hj69wRzkrFuf1Nby4yzPEFHdsmQdMoVYjvDKZSLjZFEp",
      ]);
      expect(currentAccount.balance).toStrictEqual(
        previousAccount.balance.minus(latestOperation.value),
      );
    },
  };
  return [scenarioSendSolTransaction];
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
    const solana = getCryptoCurrencyById("solana");

    const getAddress = resolver(signerContext);
    const { address } = await getAddress("", {
      path: "44'/501'/0'",
      currency: solana,
      derivationMode: "solanaSub",
    });

    const account = makeAccount(address, solana);
    setEnv("API_SOLANA_PROXY", "http://localhost:8899");
    const coinConfig: CoinConfig<SolanaCoinConfig> = () => ({
      status: {
        type: "active",
      },
      token2022Enabled: false,
      queuedInterval: 100,
      legacyOCMSMaxVersion: "1.8.0",
    });
    const { accountBridge, currencyBridge } = createBridges(signerContext, coinConfig);

    await airdrop(account.freshAddress, 5);

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

import { Scenario } from "@ledgerhq/coin-tester/main";
import { SolanaAccount, Transaction as SolanaTransaction } from "@ledgerhq/coin-solana/types";
import { spawnSpeculos } from "@ledgerhq/coin-tester/signers/speculos";

// Note this config runs with NanoX
// https://github.com/LedgerHQ/ledger-live/blob/develop/libs/coin-tester/docker-compose.yml
export const defaultNanoApp = { firmware: "2.4.2", version: "1.7.2" } as const;

export const scenarioSolana: Scenario<SolanaTransaction, SolanaAccount> = {
  name: "Ledger Live Basic Solana Transactions",
  setup: async () => {
    const [{ transport }] = await Promise.all([
      spawnSpeculos(`/${defaultNanoApp.firmware}/Solana/app_${defaultNanoApp.version}.elf`),
    ]);
    console.log({ transport });
    throw new Error("Function not implemented.");
  },
  getTransactions: address => {
    throw new Error("Function not implemented.");
  },
};

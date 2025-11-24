import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import { SolanaAccount, Transaction as SolanaTransaction } from "@ledgerhq/coin-solana/types";
import { killSpeculos, spawnSpeculos } from "@ledgerhq/coin-tester/signers/speculos";
import resolver from "@ledgerhq/coin-solana/hw-getAddress";
import { LegacySignerSolana } from "@ledgerhq/live-signer-solana";
import {
  RECIPIENT,
  SOLANA,
  SOLANA_CWIF,
  SOLANA_USDC,
  WITHDRAWABLE_AMOUNT,
  SOLANA_VIRTUAL,
  initMSW,
  makeAccount,
} from "../fixtures";
import { CoinConfig } from "@ledgerhq/coin-framework/config";
import solanaCoinConfig, { SolanaCoinConfig } from "@ledgerhq/coin-solana/config";
import BigNumber from "bignumber.js";
import { setEnv } from "@ledgerhq/live-env";
import { airdrop, killAgave, spawnAgave } from "../agave";
import { encodeAccountIdWithTokenAccountAddress } from "@ledgerhq/coin-solana/logic";
import { TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import {
  PAYER,
  STAKE_ACCOUNT,
  VOTE_ACCOUNT,
  createSplAccount,
  initStakeAccount,
  initVoteAccount,
} from "../connection";
import { Config, getChainAPI } from "@ledgerhq/coin-solana/network/index";
import { makeBridges } from "@ledgerhq/coin-solana/bridge/bridge";

global.console = require("console");
jest.setTimeout(100_000);

type SolanaScenarioTransaction = ScenarioTransaction<SolanaTransaction, SolanaAccount>;

// Note this config runs with NanoX
// https://github.com/LedgerHQ/ledger-live/blob/develop/libs/coin-tester/docker-compose.yml
export const defaultNanoApp = { firmware: "2.4.2", version: "1.9.2" } as const;

function makeScenarioTransactions(address: string): SolanaScenarioTransaction[] {
  if (!VOTE_ACCOUNT) {
    throw new Error("Vote account not initialized");
  }

  if (!STAKE_ACCOUNT) {
    throw new Error("Stake account not initialized");
  }

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

  const virtualAssociatedTokenAccountAddress = getAssociatedTokenAddressSync(
    new PublicKey(SOLANA_VIRTUAL.contractAddress),
    new PublicKey(address),
  );
  const virtualSubAccountId = encodeAccountIdWithTokenAccountAddress(
    `js:2:solana:${address}:solanaSub`,
    virtualAssociatedTokenAccountAddress.toBase58(),
  );

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

  const scenarioCreateSolStakeAccountTransaction: SolanaScenarioTransaction = {
    name: "Create Stake Account 1 Sol",
    amount: new BigNumber(1e9),
    model: {
      kind: "stake.createAccount",
      uiState: { delegate: { voteAccAddress: VOTE_ACCOUNT.votePubkey } },
    },
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toEqual(1);
      expect(latestOperation.type).toEqual("DELEGATE");
      expect(latestOperation.value).toStrictEqual(latestOperation.fee);
      expect(latestOperation.senders).toStrictEqual([]);
      expect(latestOperation.recipients).toStrictEqual([]);
      expect(latestOperation.extra).toStrictEqual({
        stake: { address: VOTE_ACCOUNT?.votePubkey, amount: new BigNumber(1e9 + 2287880) }, // amount + rent exempt reserve + fee
      });
      expect(currentAccount.balance).toStrictEqual(
        previousAccount.balance.minus(latestOperation.value),
      );
      expect(currentAccount.spendableBalance).toStrictEqual(
        previousAccount.spendableBalance.minus(1e9 + 2297880),
      );
    },
  };

  const scenarioActivateStakeAccount: SolanaScenarioTransaction = {
    name: "Activate Stake Account",
    model: {
      kind: "stake.delegate",
      uiState: {
        stakeAccAddr: STAKE_ACCOUNT.publicKey.toBase58(),
        voteAccAddr: VOTE_ACCOUNT.votePubkey,
      },
    },
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toEqual(1);
      expect(latestOperation.type).toEqual("DELEGATE");
      expect(latestOperation.value).toStrictEqual(latestOperation.fee);
      expect(latestOperation.senders).toStrictEqual([]);
      expect(latestOperation.recipients).toStrictEqual([]);
      expect(latestOperation.extra).toStrictEqual({
        stake: { address: VOTE_ACCOUNT?.votePubkey, amount: latestOperation.value },
      });
      expect(currentAccount.balance).toStrictEqual(
        previousAccount.balance.minus(latestOperation.value),
      );
    },
  };

  const scenarioDeactivateStakeAccount: SolanaScenarioTransaction = {
    name: "Deactivate Stake Account",
    model: {
      kind: "stake.undelegate",
      uiState: { stakeAccAddr: STAKE_ACCOUNT.publicKey.toBase58() },
    },
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toEqual(1);
      expect(latestOperation.type).toEqual("UNDELEGATE");
      expect(latestOperation.value).toStrictEqual(latestOperation.fee);
      expect(latestOperation.senders).toStrictEqual([]);
      expect(latestOperation.recipients).toStrictEqual([]);
      expect(currentAccount.balance).toStrictEqual(
        previousAccount.balance.minus(latestOperation.value),
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

  const scenarioStakeWithdrawTransaction: SolanaScenarioTransaction = {
    name: "Withdraw From Stake Account",
    model: {
      kind: "stake.withdraw",
      uiState: {
        stakeAccAddr: STAKE_ACCOUNT.publicKey.toBase58(),
      },
    },
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toEqual(1);
      expect(latestOperation.type).toEqual("WITHDRAW_UNBONDED");
      expect(latestOperation.value).toStrictEqual(latestOperation.fee);
      expect(latestOperation.senders).toStrictEqual([]);
      expect(latestOperation.recipients).toStrictEqual([]);
      expect(latestOperation.extra).toStrictEqual({
        stake: {
          address: STAKE_ACCOUNT?.publicKey.toBase58(),
          amount: new BigNumber(WITHDRAWABLE_AMOUNT),
        },
      });
      expect(currentAccount.balance).toStrictEqual(
        previousAccount.balance.minus(latestOperation.value),
      );
      expect(currentAccount.spendableBalance).toStrictEqual(
        previousAccount.spendableBalance.plus(WITHDRAWABLE_AMOUNT),
      );
    },
  };

  const scenarioCreateAllSolStakeAccountTransaction: SolanaScenarioTransaction = {
    name: "Create Stake Account All Sol",
    useAllAmount: true,
    model: {
      kind: "stake.createAccount",
      uiState: { delegate: { voteAccAddress: VOTE_ACCOUNT.votePubkey } },
    },
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toEqual(1);
      expect(latestOperation.type).toEqual("DELEGATE");
      expect(latestOperation.value).toStrictEqual(latestOperation.fee);
      expect(latestOperation.senders).toStrictEqual([]);
      expect(latestOperation.recipients).toStrictEqual([]);
      expect(latestOperation.extra).toMatchObject({
        stake: { address: VOTE_ACCOUNT?.votePubkey },
      });
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
    scenarioSendVirtualTransaction,
    scenarioSendAllVirtualTransaction,
    scenarioCreateSolStakeAccountTransaction,
    scenarioActivateStakeAccount,
    scenarioDeactivateStakeAccount,
    scenarioSendAllSolTransaction,
    scenarioStakeWithdrawTransaction,
    scenarioCreateAllSolStakeAccountTransaction,
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
      legacyOCMSMaxVersion: "1.8.0",
    });
    solanaCoinConfig.setCoinConfig(coinConfig);
    const chainAPICache = new Map<string, ReturnType<typeof getChainAPI>>();
    const { accountBridge, currencyBridge } = makeBridges({
      getAPI: (config: Config) => {
        const endpoint = config.endpoint;
        if (!chainAPICache.has(endpoint)) {
          chainAPICache.set(endpoint, getChainAPI(config));
        }
        return chainAPICache.get(endpoint)!;
      },
      signerContext,
    });

    await airdrop(account.freshAddress, 5);
    await airdrop(PAYER.publicKey.toBase58(), 5);
    await createSplAccount(account.freshAddress, SOLANA_USDC, 5, "spl-token");
    await createSplAccount(account.freshAddress, SOLANA_CWIF, 5, "spl-token-2022");
    // Token not supported on LL as of 09/06/2025
    await createSplAccount(account.freshAddress, SOLANA_VIRTUAL, 5, "spl-token");
    await initVoteAccount();
    await initStakeAccount(account.freshAddress, WITHDRAWABLE_AMOUNT);

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

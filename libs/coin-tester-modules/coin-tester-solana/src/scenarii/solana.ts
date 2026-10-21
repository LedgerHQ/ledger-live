import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import { Account, Operation } from "@ledgerhq/types-live";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import {
  RECIPIENT,
  SOLANA,
  SOLANA_CWIF,
  SOLANA_USDC,
  SOLANA_VIRTUAL,
  SOLANA_TSLAX,
  WITHDRAWABLE_AMOUNT,
  initMSW,
  makeAccount,
} from "../fixtures";
import type { SolanaAccount, SolanaStakingPosition } from "@ledgerhq/coin-solana/types";
import { listSolanaStakingPositions } from "@ledgerhq/coin-solana/logic";
import BigNumber from "bignumber.js";
import { Keypair } from "@solana/web3.js";
import { setEnv } from "@shared/env";
import { startSandbox } from "@ledgerhq/coin-tester/sandbox";
import type { Sandbox } from "@ledgerhq/coin-tester/sandbox";
import { encodeTokenAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import {
  STAKE_ACCOUNT,
  VOTE_ACCOUNT,
  initStakeAccount,
  initVoteAccount,
  setSolanaRpc,
} from "../connection";
import { buildSigners } from "../signer";
import { getBridges } from "../helpers";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import type { TokenCurrency } from "@ledgerhq/ledger-wallet-framework/types";

global.console = require("console");
jest.setTimeout(600_000);

type SolanaScenarioTransaction = ScenarioTransaction<GenericTransaction, Account>;

function computeSubAccountId(parentAccountId: string, token: TokenCurrency): string {
  return encodeTokenAccountId(parentAccountId, token);
}

function getSolanaPositions(account: Account): SolanaStakingPosition[] {
  return listSolanaStakingPositions((account as SolanaAccount).stakingResources);
}

function expectDelegationTo(account: Account, validatorAddress: string): void {
  const found = getSolanaPositions(account).find(p => p.validatorAddress === validatorAddress);
  expect(found).toBeDefined();
  expect(found!.amount.isGreaterThan(0)).toBe(true);
  expect(found!.positionId).toBeDefined();
}

function expectStakeExists(account: Account, stakeAddress: string): void {
  const found = getSolanaPositions(account).find(p => p.positionId === stakeAddress);
  expect(found).toBeDefined();
}

function expectStakingResourcesDefined(account: Account): void {
  expect((account as SolanaAccount).stakingResources).toBeDefined();
}

function expectStakedFundsCountedInBalanceButNotSpendable(account: Account): void {
  const stakedAmount = getSolanaPositions(account).reduce(
    (total, position) => total.plus(position.amount),
    new BigNumber(0),
  );
  expect(stakedAmount.isGreaterThan(0)).toBe(true);
  expect(account.balance.minus(account.spendableBalance).isGreaterThanOrEqualTo(stakedAmount)).toBe(
    true,
  );
}

function expectTokenSendParentOperation(
  previousAccount: Account,
  currentAccount: Account,
  tokenOperation: Operation,
): Operation {
  const [parent] = currentAccount.operations;
  expect(parent.fee.isGreaterThan(0)).toBe(true);
  expect(parent.subOperations?.map(operation => operation.id)).toEqual([tokenOperation.id]);
  expect(parent.internalOperations ?? []).toEqual([]);
  expect(currentAccount.balance).toStrictEqual(previousAccount.balance.minus(parent.value));
  return parent;
}

function expectTokenSendToExistingAta(
  previousAccount: Account,
  currentAccount: Account,
  tokenOperation: Operation,
): void {
  const parent = expectTokenSendParentOperation(previousAccount, currentAccount, tokenOperation);
  expect(parent).toMatchObject({ type: "FEES", value: parent.fee });
}

function expectTokenSendCreatingAta(
  previousAccount: Account,
  currentAccount: Account,
  tokenOperation: Operation,
): void {
  const parent = expectTokenSendParentOperation(previousAccount, currentAccount, tokenOperation);
  expect(parent.type).toEqual("OUT");
  expect(parent.value.isGreaterThan(parent.fee)).toBe(true);
}

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

  const parentAccountId = `js:2:solana:${address}:solanaSub`;

  const usdcSubAccountId = computeSubAccountId(parentAccountId, SOLANA_USDC);

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
      expectTokenSendCreatingAta(
        previousAccount,
        currentAccount,
        latestAssociatedTokenAccountOperation,
      );
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
      expectTokenSendToExistingAta(
        previousAccount,
        currentAccount,
        latestAssociatedTokenAccountOperation,
      );
      expect(latestAssociatedTokenAccountOperation.type).toEqual("OUT");
      expect(latestAssociatedTokenAccountOperation.senders).toStrictEqual([address]);
      expect(latestAssociatedTokenAccountOperation.recipients).toStrictEqual([RECIPIENT]);
      expect(currentAssociatedTokenAccount?.balance).toStrictEqual(
        previousAssociatedTokenAccount?.balance.minus(latestAssociatedTokenAccountOperation.value),
      );
      expect(currentAssociatedTokenAccount?.spendableBalance).toStrictEqual(new BigNumber(0));
    },
  };

  const cwifSubAccountId = computeSubAccountId(parentAccountId, SOLANA_CWIF);

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
      expectTokenSendCreatingAta(
        previousAccount,
        currentAccount,
        latestAssociatedTokenAccountOperation,
      );
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
      expectTokenSendToExistingAta(
        previousAccount,
        currentAccount,
        latestAssociatedTokenAccountOperation,
      );
      expect(latestAssociatedTokenAccountOperation.type).toEqual("OUT");
      expect(latestAssociatedTokenAccountOperation.senders).toStrictEqual([address]);
      expect(latestAssociatedTokenAccountOperation.recipients).toStrictEqual([RECIPIENT]);
      expect(currentAssociatedTokenAccount?.balance).toStrictEqual(
        previousAssociatedTokenAccount?.balance.minus(latestAssociatedTokenAccountOperation.value),
      );
    },
  };

  const virtualSubAccountId = computeSubAccountId(parentAccountId, SOLANA_VIRTUAL);

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
      expectTokenSendCreatingAta(
        previousAccount,
        currentAccount,
        latestAssociatedTokenAccountOperation,
      );
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
      expectTokenSendToExistingAta(
        previousAccount,
        currentAccount,
        latestAssociatedTokenAccountOperation,
      );
      expect(latestAssociatedTokenAccountOperation.type).toEqual("OUT");
      expect(latestAssociatedTokenAccountOperation.senders).toStrictEqual([address]);
      expect(latestAssociatedTokenAccountOperation.recipients).toStrictEqual([RECIPIENT]);
      expect(currentAssociatedTokenAccount?.balance).toStrictEqual(
        previousAssociatedTokenAccount?.balance.minus(latestAssociatedTokenAccountOperation.value),
      );
      expect(currentAssociatedTokenAccount?.spendableBalance).toStrictEqual(new BigNumber(0));
    },
  };
  const tslaxSubAccountId = computeSubAccountId(parentAccountId, SOLANA_TSLAX);

  const scenarioSendTslaxTransaction: SolanaScenarioTransaction = {
    name: "Send 1 TSLAx",
    amount: new BigNumber(1e8),
    recipient: RECIPIENT,
    subAccountId: tslaxSubAccountId,
    expect: (previousAccount, currentAccount) => {
      expect(currentAccount.operations.length - previousAccount.operations.length).toEqual(1);

      const currentAssociatedTokenAccount = currentAccount.subAccounts?.find(
        sa => sa.id === tslaxSubAccountId,
      );
      const previousAssociatedTokenAccount = previousAccount.subAccounts?.find(
        sa => sa.id === tslaxSubAccountId,
      );
      const [latestAssociatedTokenAccountOperation] =
        currentAssociatedTokenAccount?.operations ?? [];
      expectTokenSendCreatingAta(
        previousAccount,
        currentAccount,
        latestAssociatedTokenAccountOperation,
      );
      expect(latestAssociatedTokenAccountOperation.type).toEqual("OUT");
      expect(latestAssociatedTokenAccountOperation.value).toStrictEqual(new BigNumber(1e8));
      expect(latestAssociatedTokenAccountOperation.senders).toStrictEqual([address]);
      expect(latestAssociatedTokenAccountOperation.recipients).toStrictEqual([RECIPIENT]);
      expect(currentAssociatedTokenAccount?.balance).toStrictEqual(
        previousAssociatedTokenAccount?.balance.minus(latestAssociatedTokenAccountOperation.value),
      );
    },
  };

  const scenarioSendAllTslaxTransaction: SolanaScenarioTransaction = {
    name: "Send All TSLAx",
    useAllAmount: true,
    recipient: RECIPIENT,
    subAccountId: tslaxSubAccountId,
    expect: (previousAccount, currentAccount) => {
      const currentAssociatedTokenAccount = currentAccount.subAccounts?.find(
        sa => sa.id === tslaxSubAccountId,
      );
      const previousAssociatedTokenAccount = previousAccount.subAccounts?.find(
        sa => sa.id === tslaxSubAccountId,
      );
      const [latestAssociatedTokenAccountOperation] =
        currentAssociatedTokenAccount?.operations ?? [];
      expectTokenSendToExistingAta(
        previousAccount,
        currentAccount,
        latestAssociatedTokenAccountOperation,
      );
      expect(latestAssociatedTokenAccountOperation.type).toEqual("OUT");
      expect(latestAssociatedTokenAccountOperation.senders).toStrictEqual([address]);
      expect(currentAccount.operations.length - previousAccount.operations.length).toEqual(1);
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

  const scenarioCreateSolStakeAccountTransaction: SolanaScenarioTransaction = {
    name: "Create Stake Account 1 Sol",
    amount: new BigNumber(1e9),
    recipient: VOTE_ACCOUNT.votePubkey,
    mode: "stake",
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toEqual(1);
      expect(latestOperation.type).toEqual("DELEGATE");
      expect(latestOperation.value).toStrictEqual(latestOperation.fee);
      expect(latestOperation.senders).toStrictEqual([]);
      expect(latestOperation.recipients).toStrictEqual([]);
      // Delegation, stake rent exemption (2282880) and the transaction fee, priority fee included.
      const staked = new BigNumber(1e9 + 2282880).plus(latestOperation.fee);
      expect(latestOperation.extra).toMatchObject({
        stake: { address: VOTE_ACCOUNT?.votePubkey, amount: staked },
      });
      expect(currentAccount.balance).toStrictEqual(
        previousAccount.balance.minus(latestOperation.value),
      );
      // Spendable also holds back the unstake reserve: the future undelegate and withdraw fees, each
      // the 5000 base fee plus a priority fee of at least 1, which follows the recent-fee median.
      const reserve = previousAccount.spendableBalance
        .minus(currentAccount.spendableBalance)
        .minus(staked);
      expect(reserve.isGreaterThan(2 * 5000)).toBe(true);
      // Verify staking resources are populated after sync with delegation to the validator
      expectDelegationTo(currentAccount, VOTE_ACCOUNT!.votePubkey);
      expectStakedFundsCountedInBalanceButNotSpendable(currentAccount);
    },
  };

  const scenarioActivateStakeAccount: SolanaScenarioTransaction = {
    name: "Activate Stake Account",
    recipient: VOTE_ACCOUNT.votePubkey,
    mode: "delegate",
    memoType: "STAKE_ACCOUNT",
    memoValue: STAKE_ACCOUNT.publicKey.toBase58(),
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
      // Verify the stake account is now delegated
      expectDelegationTo(currentAccount, VOTE_ACCOUNT!.votePubkey);
      expectStakedFundsCountedInBalanceButNotSpendable(currentAccount);
    },
  };

  const scenarioDeactivateStakeAccount: SolanaScenarioTransaction = {
    name: "Deactivate Stake Account",
    recipient: STAKE_ACCOUNT.publicKey.toBase58(),
    mode: "undelegate",
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
      // Verify the stake account still exists (state may be "deactivating" or still
      // "active" depending on epoch boundary timing on the local validator)
      expectStakeExists(currentAccount, STAKE_ACCOUNT!.publicKey.toBase58());
    },
  };

  const scenarioStakeWithdrawTransaction: SolanaScenarioTransaction = {
    name: "Withdraw From Stake Account",
    recipient: STAKE_ACCOUNT.publicKey.toBase58(),
    amount: new BigNumber(WITHDRAWABLE_AMOUNT),
    mode: "unstake",
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
      // Emptying the stake account releases its share of the unstake reserve: a withdraw fee estimated
      // on a dummy transaction priced on the runtime default compute-unit limit, above the simulated
      // limit the real withdraw signs, so it covers the fee paid and may exceed it.
      expect(
        currentAccount.spendableBalance
          .minus(previousAccount.spendableBalance)
          .isGreaterThanOrEqualTo(WITHDRAWABLE_AMOUNT),
      ).toBe(true);
      // Verify staking resources still exist after partial withdrawal
      // (spendableBalance increase above already validates the withdraw landed)
      expectStakingResourcesDefined(currentAccount);
    },
  };

  const scenarioCreateAllSolStakeAccountTransaction: SolanaScenarioTransaction = {
    name: "Create Stake Account All Sol",
    useAllAmount: true,
    recipient: VOTE_ACCOUNT.votePubkey,
    mode: "stake",
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
      // The fee is estimated on a dummy delegating 0 lamports, which cannot be simulated, so it is
      // priced on the runtime default compute-unit limit: what it overestimates stays spendable.
      expect(currentAccount.spendableBalance.isLessThan(latestOperation.fee)).toBe(true);
      // Verify staking resources reflect the new stake
      expectDelegationTo(currentAccount, VOTE_ACCOUNT!.votePubkey);
      expectStakedFundsCountedInBalanceButNotSpendable(currentAccount);
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
    scenarioSendTslaxTransaction,
    scenarioSendAllTslaxTransaction,
    scenarioCreateSolStakeAccountTransaction,
    scenarioActivateStakeAccount,
    scenarioDeactivateStakeAccount,
    scenarioSendAllSolTransaction,
    scenarioStakeWithdrawTransaction,
    scenarioCreateAllSolStakeAccountTransaction,
  ];
}

let closeMSW: (() => void) | null = null;
let sandbox: Sandbox | undefined;

export const scenarioSolana: Scenario<GenericTransaction, Account> = {
  name: "Ledger Live Basic Solana Transactions",
  setup: async () => {
    sandbox = await startSandbox(
      { family: "solana", network: "solana" },
      { node: { provider: "agave", version: "4.3.0" } },
    );
    const rpc = sandbox.endpoints.node;
    if (rpc === undefined) throw new Error("the sandbox instance has no node endpoint");
    setSolanaRpc(rpc);

    setEnv("API_SOLANA_PROXY", rpc);

    LiveConfig.setConfig({
      config_currency_solana: {
        type: "object",
        default: {
          status: { type: "active" },
          name: "Solana",
          unit: { name: "SOL", code: "SOL", magnitude: 9 },
          token2022Enabled: true,
          legacyOCMSMaxVersion: "1.8.0",
        },
      },
    });

    const signers = await buildSigners();
    const { accountBridge, currencyBridge, getAddress } = await getBridges(signers);

    const { address } = await getAddress("", {
      path: "44'/501'/0'",
      currency: SOLANA,
      derivationMode: "solanaSub",
    });

    const account = makeAccount(address, SOLANA);

    await sandbox.airdrop(account.freshAddress, 5);
    // The sandbox creates the associated token account, then mints
    for (const token of [SOLANA_USDC, SOLANA_CWIF, SOLANA_VIRTUAL, SOLANA_TSLAX]) {
      await sandbox.airdrop(account.freshAddress, 5, token.contractAddress);
    }
    await initVoteAccount();
    // A throwaway key pays for the stake account: the sandbox funds it, no key is kept in the tester
    const stakePayer = Keypair.generate();
    await sandbox.airdrop(stakePayer.publicKey.toBase58(), 5);
    await initStakeAccount(stakePayer, account.freshAddress, WITHDRAWABLE_AMOUNT);

    closeMSW = initMSW(rpc);

    return {
      account,
      accountBridge,
      currencyBridge,
    };
  },
  getTransactions: address => makeScenarioTransactions(address),
  teardown: async () => {
    closeMSW?.();
    closeMSW = null;
    await sandbox?.down();
    sandbox = undefined;
  },
};

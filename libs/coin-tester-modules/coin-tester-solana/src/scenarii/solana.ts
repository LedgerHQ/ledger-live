import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import { Account } from "@ledgerhq/types-live";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import type { BridgeStrategy } from "@ledgerhq/coin-tester/types";
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
import type { SolanaAccount } from "@ledgerhq/coin-solana/types";
import BigNumber from "bignumber.js";
import { setEnv } from "@ledgerhq/live-env";
import { airdrop, killAgave, spawnAgave } from "../agave";
import { encodeTokenAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import { encodeAccountIdWithTokenAccountAddress } from "@ledgerhq/coin-solana/logic";
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import {
  PAYER,
  STAKE_ACCOUNT,
  VOTE_ACCOUNT,
  createSplAccount,
  initStakeAccount,
  initVoteAccount,
} from "../connection";
import { buildSigners } from "../signer";
import { getBridges } from "../helpers";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";

global.console = require("console");
jest.setTimeout(100_000);

type SolanaScenarioTransaction = ScenarioTransaction<GenericTransaction, Account>;

function computeSubAccountId(
  parentAccountId: string,
  address: string,
  token: TokenCurrency,
  programId: PublicKey,
  strategy: BridgeStrategy,
): string {
  if (strategy === "legacy") {
    const ata = getAssociatedTokenAddressSync(
      new PublicKey(token.contractAddress),
      new PublicKey(address),
      undefined,
      programId,
    );
    return encodeAccountIdWithTokenAccountAddress(parentAccountId, ata.toBase58());
  }
  return encodeTokenAccountId(parentAccountId, token);
}

function getSolanaStakes(account: Account): SolanaAccount["solanaResources"]["stakes"] {
  return (account as SolanaAccount).solanaResources?.stakes ?? [];
}

interface StakingResourcesShape {
  delegations: Array<{ validatorAddress: string; amount: BigNumber }>;
  unbondings: Array<{ validatorAddress: string; amount: BigNumber }>;
  delegatedBalance: BigNumber;
  unbondingBalance: BigNumber;
  pendingRewardsBalance: BigNumber;
}

/** Extract stakingResources set by the generic-coin-framework bridge (not typed on Account). */
function getStakingResources(account: Account): StakingResourcesShape | undefined {
  const raw = (account as Account & { stakingResources?: StakingResourcesShape }).stakingResources;
  return raw;
}

/**
 * Strategy-agnostic staking assertions.
 * Legacy exposes `solanaResources.stakes`, generic-adapter exposes `stakingResources`.
 * These helpers verify the same semantic invariants regardless of strategy.
 */
function expectDelegationTo(
  account: Account,
  strat: BridgeStrategy,
  validatorAddress: string,
): void {
  if (strat === "legacy") {
    const stakes = getSolanaStakes(account);
    const found = stakes.find(s => s.delegation?.voteAccAddr === validatorAddress);
    expect(found).toBeDefined();
  } else {
    const sr = getStakingResources(account);
    expect(sr).toBeDefined();
    const found = sr!.delegations.find(d => d.validatorAddress === validatorAddress);
    expect(found).toBeDefined();
    expect(found!.amount.isGreaterThan(0)).toBe(true);
  }
}

function expectStakeExists(account: Account, strat: BridgeStrategy, stakeAddress: string): void {
  if (strat === "legacy") {
    const found = getSolanaStakes(account).find(s => s.stakeAccAddr === stakeAddress);
    expect(found).toBeDefined();
  } else {
    // generic-adapter doesn't expose individual stake addresses, check total staking > 0
    const sr = getStakingResources(account);
    expect(sr).toBeDefined();
    const totalStaking = sr!.delegatedBalance.plus(sr!.unbondingBalance);
    expect(totalStaking.isGreaterThan(0)).toBe(true);
  }
}

function expectStakingResourcesDefined(account: Account, strat: BridgeStrategy): void {
  if (strat === "legacy") {
    expect(getSolanaStakes(account)).toBeDefined();
  } else {
    expect(getStakingResources(account)).toBeDefined();
  }
}

function makeScenarioTransactions(
  address: string,
  strategy: BridgeStrategy,
): SolanaScenarioTransaction[] {
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

  const usdcSubAccountId = computeSubAccountId(
    parentAccountId,
    address,
    SOLANA_USDC,
    TOKEN_PROGRAM_ID,
    strategy,
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

  const cwifSubAccountId = computeSubAccountId(
    parentAccountId,
    address,
    SOLANA_CWIF,
    TOKEN_2022_PROGRAM_ID,
    strategy,
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

  const virtualSubAccountId = computeSubAccountId(
    parentAccountId,
    address,
    SOLANA_VIRTUAL,
    TOKEN_PROGRAM_ID,
    strategy,
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
  const tslaxSubAccountId = computeSubAccountId(
    parentAccountId,
    address,
    SOLANA_TSLAX,
    TOKEN_2022_PROGRAM_ID,
    strategy,
  );

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
      if (strategy === "generic-adapter") {
        expect(latestOperation.senders).toStrictEqual([]);
        expect(latestOperation.recipients).toStrictEqual([]);
      }
      expect(latestOperation.extra).toMatchObject({
        stake: { address: VOTE_ACCOUNT?.votePubkey, amount: new BigNumber(1e9 + 2287880) }, // amount + rent exempt reserve + fee
      });
      expect(currentAccount.balance).toStrictEqual(
        previousAccount.balance.minus(latestOperation.value),
      );
      // 1e9 (delegation) + 2287880 (stake rent exempt) + 5000 (tx fee) + 5000 (unstakeReserve = 1 withdrawFee)
      expect(currentAccount.spendableBalance).toStrictEqual(
        previousAccount.spendableBalance.minus(1e9 + 2297880),
      );
      // Verify staking resources are populated after sync with delegation to the validator
      expectDelegationTo(currentAccount, strategy, VOTE_ACCOUNT!.votePubkey);
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
      expectDelegationTo(currentAccount, strategy, VOTE_ACCOUNT!.votePubkey);
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
      expectStakeExists(currentAccount, strategy, STAKE_ACCOUNT!.publicKey.toBase58());
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
      if (strategy === "generic-adapter") {
        expect(latestOperation.senders).toStrictEqual([]);
        expect(latestOperation.recipients).toStrictEqual([]);
      }
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
      // Verify staking resources still exist after partial withdrawal
      // (spendableBalance increase above already validates the withdraw landed)
      expectStakingResourcesDefined(currentAccount, strategy);
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
      if (strategy === "generic-adapter") {
        expect(latestOperation.senders).toStrictEqual([]);
        expect(latestOperation.recipients).toStrictEqual([]);
      }
      expect(latestOperation.extra).toMatchObject({
        stake: { address: VOTE_ACCOUNT?.votePubkey },
      });
      expect(currentAccount.balance).toStrictEqual(
        previousAccount.balance.minus(latestOperation.value),
      );
      expect(currentAccount.spendableBalance).toStrictEqual(new BigNumber(0));
      // Verify staking resources reflect the new stake
      expectDelegationTo(currentAccount, strategy, VOTE_ACCOUNT!.votePubkey);
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

export const scenarioSolana: Scenario<GenericTransaction, Account> = {
  name: "Ledger Live Basic Solana Transactions",
  setup: async strategy => {
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

    const signers = await buildSigners();
    const { accountBridge, currencyBridge, getAddress } = await getBridges(strategy, signers);

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
    await createSplAccount(account.freshAddress, SOLANA_TSLAX, 5, "spl-token-2022");
    await initVoteAccount();
    await initStakeAccount(account.freshAddress, WITHDRAWABLE_AMOUNT);

    closeMSW = initMSW();

    return {
      account,
      accountBridge,
      currencyBridge,
    };
  },
  getTransactions: (address, strategy) => makeScenarioTransactions(address, strategy),
  teardown: async () => {
    closeMSW?.();
    closeMSW = null;
    await killAgave();
  },
};

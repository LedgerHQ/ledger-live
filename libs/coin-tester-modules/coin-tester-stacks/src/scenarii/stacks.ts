import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import type { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import { fetchPoxInfo } from "@ledgerhq/coin-stacks/network/pox";
import {
  DEPLOYER_ADDRESS,
  DEPLOYER_PRIVATE_KEY,
  RECIPIENT_PRIVATE_KEY,
  STACKS,
  TEST_TOKEN,
  TOKEN_CONTRACT_NAME,
  makeAccount,
  registerTestTokenInMockStore,
} from "../fixtures";
import { getBridges } from "../helpers";
import { initMSW } from "../indexer";
import { buildStacksTestSigner } from "../signer";
import { buildStacksGenericTestSigner } from "../genericSigner";
import { killDevnet, spawnDevnet, waitForContractDeployment } from "../devnet";
import { setupSignerManager } from "../signerManager";

let closeMsw: (() => void) | null = null;
let subAccountId = "";
let recipientAddress = "";
let stakingValAddress = "";
let startBurnHt = 0;

type Tx = ScenarioTransaction<GenericTransaction, Account>;
type StakingTx = ScenarioTransaction<GenericTransaction, Account>;

const SIGNER_MANAGER_CONTRACT_NAME = "signer-manager-stub";

function makeTransactions(): Tx[] {
  // A fresh devnet has never mined a plain STX transfer or a call to this specific contract, and
  // stacks-node's fee estimator has no historical cost data to estimate from for either payload
  // shape yet — verified live: `/v2/fees/transaction` returns `NoEstimateAvailable` for both, not
  // just for contract-calls. `prepareTransaction.ts`'s fee override (skips the network estimate
  // when a positive `fee` is already set) works around this; the values are generous flat
  // fee-per-byte guesses, not measured, since there's no estimate to measure against on this chain.
  const NATIVE_FEE = new BigNumber(3_000);
  const TOKEN_FEE = new BigNumber(10_000);

  const sendStx: Tx = {
    name: "Send 1 STX",
    amount: new BigNumber(1_000_000), // 1 STX (6 decimals)
    recipient: recipientAddress,
    customFees: { parameters: { fees: NATIVE_FEE } },
    expect: (prev, curr) => {
      expect(curr.operations.length).toBeGreaterThan(prev.operations.length);
      const [latestOp] = curr.operations;
      expect(latestOp.type).toBe("OUT");
      expect(latestOp.recipients).toContain(recipientAddress);
      expect(curr.balance).toStrictEqual(
        prev.balance.minus(new BigNumber(1_000_000)).minus(latestOp.fee),
      );
    },
  };

  const sendMaxStx: Tx = {
    name: "Send max STX",
    amount: new BigNumber(0),
    useAllAmount: true,
    recipient: recipientAddress,
    customFees: { parameters: { fees: NATIVE_FEE } },
    expect: (prev, curr) => {
      expect(curr.operations.length).toBeGreaterThan(prev.operations.length);
      const [latestOp] = curr.operations;
      expect(latestOp.type).toBe("OUT");
      expect(latestOp.recipients).toContain(recipientAddress);
      expect(curr.spendableBalance.isZero()).toBe(true);
      expect(curr.balance.lt(prev.balance)).toBe(true);
    },
  };

  const sendToken: Tx = {
    name: "Send 10 CTT",
    amount: new BigNumber(10_000_000), // 10 CTT (6 decimals)
    recipient: recipientAddress,
    subAccountId,
    customFees: { parameters: { fees: TOKEN_FEE } },
    expect: (prev, curr) => {
      const sub = curr.subAccounts?.find(s => s.id === subAccountId);
      const prevSub = prev.subAccounts?.find(s => s.id === subAccountId);
      expect(sub).toBeDefined();
      expect(sub!.balance).toStrictEqual(
        (prevSub?.balance ?? new BigNumber(0)).minus(new BigNumber(10_000_000)),
      );
      expect(sub!.operations.length).toBeGreaterThan(prevSub?.operations.length ?? 0);
      const [latestOp] = sub!.operations;
      expect(latestOp.type).toBe("OUT");
      expect(latestOp.recipients).toContain(recipientAddress);
    },
  };

  const sendMaxToken: Tx = {
    name: "Send max CTT",
    amount: new BigNumber(0),
    useAllAmount: true,
    recipient: recipientAddress,
    subAccountId,
    customFees: { parameters: { fees: TOKEN_FEE } },
    expect: (_prev, curr) => {
      const sub = curr.subAccounts?.find(s => s.id === subAccountId);
      expect(sub).toBeDefined();
      // Token sweeps don't subtract the fee (fees are paid in STX, not in the SIP-010 token) —
      // matches `resolveAmount`-equivalent comment in `coin-stacks/bridge/prepareTransaction.ts`.
      expect(sub!.spendableBalance.isZero()).toBe(true);
      const [latestOp] = sub!.operations;
      expect(latestOp.type).toBe("OUT");
      expect(latestOp.recipients).toContain(recipientAddress);
    },
  };

  // Native sends drain most of the STX balance (send-max leaves only enough to cover future
  // fees), so the token sends run first while there's still a comfortable STX balance to pay their
  // fees from; native max runs last since nothing here depends on the STX balance afterwards.
  return [sendToken, sendMaxToken, sendStx, sendMaxStx];
}

export const scenarioStacks: Scenario<GenericTransaction, Account> = {
  name: "Ledger Live Stacks (STX + SIP-010 token)",

  setup: async strategy => {
    await spawnDevnet();
    // 15 minutes: at the 10s-per-block cadence (`scripts/bitcoin-miner.js`), reaching the
    // contract's deployment batch (epoch 3.0, ~42 blocks past genesis) needs ~7 minutes in the
    // worst case. Generous margin above that, not a different mechanism.
    await waitForContractDeployment(DEPLOYER_ADDRESS, TOKEN_CONTRACT_NAME, 15 * 60 * 1000);

    const funder = buildStacksTestSigner(DEPLOYER_PRIVATE_KEY);
    const genericFunder = buildStacksGenericTestSigner(DEPLOYER_PRIVATE_KEY);
    const recipient = buildStacksTestSigner(RECIPIENT_PRIVATE_KEY);
    recipientAddress = recipient.address;

    registerTestTokenInMockStore();
    closeMsw = initMSW();

    const { currencyBridge, accountBridge } = await getBridges(strategy, {
      legacy: funder.signer,
      generic: genericFunder.signer,
    });
    const account = makeAccount(funder.publicKey, funder.address);

    // retryLimit bumped from 40 to 90 (200s -> 450s headroom): occasionally, a balance/
    // spendableBalance assertion took longer than 300s to catch up through the indexer during
    // verification, intermittently exhausting a smaller limit even on otherwise-successful runs.
    return {
      currencyBridge,
      accountBridge,
      account,
      retryInterval: 5000,
      retryLimit: 90,
    };
  },

  getTransactions: () => makeTransactions(),

  beforeAll: account => {
    expect(account.currency.id).toBe(STACKS.id);
    expect(account.balance.gt(0)).toBe(true);
    // Matched by the token's own stable identity, not by a pre-computed parent-account-id-based
    // string: the legacy bridge keys `account.id` on the public key (`makeAccount`'s doc-comment)
    // while the generic-adapter's own sync keys it on the address, so the two strategies produce
    // differently-shaped (but equally valid) subAccount ids for the same underlying account.
    // `getTransactions()` runs after this hook, so every transaction below picks up the
    // strategy-correct id via this module-level variable.
    const token = account.subAccounts?.find(s => s.token.id === TEST_TOKEN.id);
    expect(token).toBeDefined();
    expect(token!.balance.gt(0)).toBe(true);
    subAccountId = token!.id;
  },

  afterAll: (account, strategy) => {
    // Legacy (`sip010OpToParentOp`, bridge/utils/misc.ts) echoes each SIP-010 send as a zero-value
    // "parent" OUT operation alongside the sub-account's own OUT -- 2 native + 2 token-echoed-as-OUT
    // = 4. generic-coin-framework's own parent-op synthesis for a token-only tx
    // (`syntheticParentForTokenOnlyTx`, getAccountShape.ts) instead types that echo "FEES" (the
    // account paid the tx fee) or "NONE", never "OUT" -- so only the 2 native sends count there.
    const expectedParentOutCount = strategy === "legacy" ? 4 : 2;
    expect(account.operations.filter(op => op.type === "OUT")).toHaveLength(expectedParentOutCount);
    const token = account.subAccounts?.find(s => s.id === subAccountId);
    expect(token).toBeDefined();
    expect(token!.operations.filter(op => op.type === "OUT")).toHaveLength(2);
  },

  teardown: async () => {
    closeMsw?.();
    closeMsw = null;
    await killDevnet();
  },
};

/**
 * Staking (pox-5 `stake`/`unstake`) only exists through `generic-adapter` -- the legacy bridge has
 * no staking code at all -- so this runs as its own scenario/devnet lifecycle rather than a second
 * `describe.each` branch of `scenarioStacks`. `startBurnHt` just needs to fall within the *current*
 * reward cycle (verified by reading `pox-5.clar`'s `stake`: it always locks starting at
 * `current-cycle + 1` and only validates that the caller's `startBurnHt` maps back to
 * `current-cycle`), so the live `current_burnchain_block_height` captured once at setup time is
 * safe to reuse for the whole scenario -- there's no cycle-boundary wait involved.
 */
function makeStakingTransactions(valAddress: string, startBurnHt: number): StakingTx[] {
  const STAKE_FEE = new BigNumber(20_000);
  const STAKE_AMOUNT = new BigNumber(5_000_000); // 5 STX (6 decimals)

  const delegate: StakingTx = {
    name: "Delegate (stake) 5 STX",
    mode: "delegate",
    valAddress,
    recipient: valAddress,
    amount: STAKE_AMOUNT,
    // `customFees.parameters.fees`, not the plain `fees` field: `genericPrepareTransaction`
    // (`generic-coin-framework/prepareTransaction.ts`) only skips the network fee estimate when
    // *this* nested field is set -- a fresh devnet has no historical cost data for a pox-5
    // contract-call payload yet, so without this override `estimateFees` throws
    // `NoEstimateAvailableError`, verified empirically (mirrors why `scenarioStacks`'s own
    // STX/SIP-010 sends set an explicit fee too, just via the legacy bridge's own override field).
    customFees: { parameters: { fees: STAKE_FEE } },
    familySpecificData: { numCycles: 1, startBurnHt },
    expect: (prev, curr) => {
      expect(curr.operations.length).toBeGreaterThan(prev.operations.length);
      const [latestOp] = curr.operations;
      // `Operation.type` is cast, not runtime-mapped, from `coin-stacks`'s own raw pox-5 function
      // name (`generic-coin-framework/utils.ts`'s `adaptCoreOperationToLiveOperation`) -- the
      // `OperationType` union only has the uppercase convention, so the real runtime value here is
      // the lowercase Clarity function name.
      expect(latestOp.type as string).toBe("stake");
      // Balance is total (locked stays in it, only the fee leaves); spendableBalance drops by at
      // least the staked amount -- not asserted as an exact equality, since the generic-adapter's
      // exact locked-funds arithmetic isn't otherwise exercised by this package's existing tests.
      expect(curr.balance).toStrictEqual(prev.balance.minus(latestOp.fee));
      expect(curr.spendableBalance.lt(prev.spendableBalance.minus(STAKE_AMOUNT))).toBe(true);
    },
  };

  const undelegate: StakingTx = {
    name: "Undelegate (unstake)",
    mode: "undelegate",
    valAddress,
    recipient: valAddress,
    amount: new BigNumber(0),
    customFees: { parameters: { fees: STAKE_FEE } },
    expect: (prev, curr) => {
      expect(curr.operations.length).toBeGreaterThan(prev.operations.length);
      const [latestOp] = curr.operations;
      expect(latestOp.type as string).toBe("unstake");
      expect(curr.balance).toStrictEqual(prev.balance.minus(latestOp.fee));
    },
  };

  return [delegate, undelegate];
}

export const scenarioStacksStaking: Scenario<GenericTransaction, Account> = {
  name: "Ledger Live Stacks (pox-5 staking, generic-adapter)",

  setup: async strategy => {
    await spawnDevnet();
    await waitForContractDeployment(DEPLOYER_ADDRESS, TOKEN_CONTRACT_NAME, 15 * 60 * 1000);
    // 25 minutes, not 15: `signer-manager-stub` is pinned at epoch 4.0 (`Clarinet.toml`), which the
    // chain must first cross (`DEFAULT_EPOCH_4_0 = 162` burn blocks) before its deployment batch
    // even attempts -- empirically ~14-17 minutes at this devnet's mining cadence, so 15 minutes
    // left no margin at all.
    await waitForContractDeployment(DEPLOYER_ADDRESS, SIGNER_MANAGER_CONTRACT_NAME, 25 * 60 * 1000);

    const funder = buildStacksTestSigner(DEPLOYER_PRIVATE_KEY);
    const genericFunder = buildStacksGenericTestSigner(DEPLOYER_PRIVATE_KEY);

    // Read first: pox-5 is a separate, literally-named contract (`...pox-5`), not something `.pox`
    // ever aliases to -- `poxInfo.contract_id` is the live source of truth for its current address,
    // same as `buildUnsignedTx.ts`'s own `buildStaking`.
    const poxInfo = await fetchPoxInfo();
    startBurnHt = poxInfo.current_burnchain_block_height;

    const { valAddress } = await setupSignerManager(
      DEPLOYER_PRIVATE_KEY,
      DEPLOYER_ADDRESS,
      poxInfo.contract_id,
    );
    stakingValAddress = valAddress;

    const { currencyBridge, accountBridge } = await getBridges(strategy, {
      legacy: funder.signer,
      generic: genericFunder.signer,
    });
    const account = makeAccount(funder.publicKey, funder.address);

    return {
      currencyBridge,
      accountBridge,
      account,
      retryInterval: 5000,
      retryLimit: 90,
    };
  },

  getTransactions: () => makeStakingTransactions(stakingValAddress, startBurnHt),

  beforeAll: account => {
    expect(account.currency.id).toBe(STACKS.id);
    expect(account.balance.gt(0)).toBe(true);
  },

  afterAll: account => {
    expect(account.operations.some(op => (op.type as string) === "stake")).toBe(true);
    expect(account.operations.some(op => (op.type as string) === "unstake")).toBe(true);
  },

  teardown: async () => {
    await killDevnet();
  },
};

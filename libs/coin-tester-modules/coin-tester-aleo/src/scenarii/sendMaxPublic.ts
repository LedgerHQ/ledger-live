import BigNumber from "bignumber.js";
import { setupServer } from "msw/node";
import { firstValueFrom, reduce } from "rxjs";
import type { AccountBridge } from "@ledgerhq/types-live";
import type { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import type { AleoAccount, Transaction as AleoTransaction } from "@ledgerhq/coin-aleo/types";
import {
  ALEO,
  PUBLIC_DEVNODE_FEE_RANGE,
  FUNDING_AMOUNT_MICROCREDITS,
  SEND_MAX_PUBLIC_AMOUNT_MICROCREDITS,
  TRANSFER_PUBLIC_BASE_FEE,
  buildAleoCoinConfig,
  generateAleoAccount,
  getPublicBalance,
  makeAleoAccount,
  type GeneratedAleoAccount,
} from "../fixtures";
import { getBridges } from "../helpers";
import { buildAleoHandlers } from "../msw/handlers";
import { buildTransaction } from "../msw/prove";
import { buildMockAleoSigner } from "../signer";
import { advanceBlocks } from "../stack";

const mockServer = setupServer();

// Generated fresh per test run, then funded from GENESIS_ACCOUNT in setup():
// sender is the account the harness tracks (so its sync exposes the OUT side),
// recipient is synced by hand in afterAll (so its sync exposes the IN side).
let sender: GeneratedAleoAccount;
let recipient: GeneratedAleoAccount;
let accountBridge: AccountBridge<AleoTransaction, AleoAccount>;

/**
 * Sends `amount` straight to the devnode from GENESIS_ACCOUNT, bypassing the
 * bridge under test, and waits until the recipient's public balance reflects
 * it. Mirrors the probe pattern in scenarii.test.ts.
 */
async function fundFromGenesis(recipientAddress: string, amount: number): Promise<void> {
  await buildTransaction({ recipient: recipientAddress, amount });

  for (let attempt = 0; attempt < 10; attempt++) {
    await advanceBlocks(1);
    if ((await getPublicBalance(recipientAddress)) >= BigInt(amount)) return;
  }

  throw new Error(`aleo coin-tester: funding transfer to ${recipientAddress} did not confirm`);
}

const sendMaxPublic: ScenarioTransaction<AleoTransaction, AleoAccount> = {
  // `amount` is left at createTransaction()'s default (BigNumber(0)):
  // getAmountToSpend's native-public branch ignores it once useAllAmount is
  // true, deriving the amount from the transparent balance and estimatedFees.
  name: "Send max public microcredits from a funded sender to a fresh recipient",
  useAllAmount: true,
  get recipient() {
    return recipient.address;
  },
  // Assertions must be synchronous: the harness calls expect() synchronously and
  // retries it on assertion failure. Anything awaited goes to afterAll.
  expect: (previous, current) => {
    // `sender` was funded moments earlier in the same block window, so its own
    // IN operation and this OUT can land with equal `date` precision — picking
    // "the newest operation" by index is not reliable here. Diffing against the
    // pre-broadcast sync is: whatever operation is new is this transaction's.
    const newOperations = current.operations.filter(
      currentOp => !previous.operations.some(previousOp => previousOp.id === currentOp.id),
    );
    expect(newOperations).toHaveLength(1);
    const [latest] = newOperations;

    expect(latest.type).toBe("OUT");
    expect(latest.hasFailed).toBe(false);
    expect(latest.recipients).toStrictEqual([recipient.address]);
    // IN/OUT follows only from address === recipient_address, so a wrong
    // sender_address would not break classification — hence the explicit check.
    expect(latest.senders).toStrictEqual([sender.address]);

    // The chain-priced fee tracks whatever @provablehq/sdk's consensus version and
    // cost table happen to be, so only the order of magnitude is checked here; the
    // exact TRANSFER_PUBLIC_BASE_FEE the bridge bills is checked on the fee
    // authorization in the prove handler.
    expect(latest.fee.toNumber()).toBeGreaterThanOrEqual(PUBLIC_DEVNODE_FEE_RANGE.min);
    expect(latest.fee.toNumber()).toBeLessThanOrEqual(PUBLIC_DEVNODE_FEE_RANGE.max);

    // If the billed fee ever stopped covering the chain's own fee, the on-chain
    // `sub` in fee_public would underflow and the transfer would never land —
    // this assertion is the point of the scenario.
    expect(latest.fee.toNumber()).toBeLessThanOrEqual(TRANSFER_PUBLIC_BASE_FEE);

    // An operation's value is fee-exclusive: it carries the send-max amount
    // alone, and the fee travels beside it in `operation.fee`.
    expect(latest.value).toStrictEqual(new BigNumber(SEND_MAX_PUBLIC_AMOUNT_MICROCREDITS));

    // The send-max amount is the balance minus the BILLED fee, while the chain
    // charges the lower fee asserted above, so the account keeps that
    // difference as dust. The balance moves by the amount plus the real fee.
    expect(current.balance).toStrictEqual(previous.balance.minus(latest.value).minus(latest.fee));
    expect(current.pendingOperations).toStrictEqual([]);
  },
};

export const scenarioSendMaxPublic: Scenario<AleoTransaction, AleoAccount> = {
  name: "Ledger Live Aleo — public credit send-max",

  // Deliberately does not touch docker: spawnStack begins with
  // `compose down --volumes`, so calling it here would kill the running stack
  // mid-file, smoke-test ledger included.
  setup: async () => {
    setCryptoAssetsStore({
      findTokenById: async () => undefined,
      findTokenByAddressInCurrency: async () => undefined,
      getTokensSyncHash: async () => "",
    });

    [sender, recipient] = await Promise.all([generateAleoAccount(), generateAleoAccount()]);

    mockServer.listen({
      onUnhandledRequest: request => {
        const { hostname } = new URL(request.url);
        // Localhost is the real SDK backend and devnode; everything else must be
        // handled here or fail loudly.
        if (["127.0.0.1", "localhost"].includes(hostname)) return;
        throw new Error(`Unhandled request: ${request.method} ${request.url}`);
      },
    });
    mockServer.use(
      ...buildAleoHandlers({
        recipient: recipient.address,
        amount: SEND_MAX_PUBLIC_AMOUNT_MICROCREDITS,
        senderPrivateKey: sender.privateKey,
      }),
    );

    // Funds `sender` directly from the devnode, ahead of and outside the
    // bridge under test, so the scenario's own transfer is the first thing
    // that ever touches `sender`'s balance through the bridge.
    await fundFromGenesis(sender.address, FUNDING_AMOUNT_MICROCREDITS);

    const signer = buildMockAleoSigner(sender.privateKey);
    const bridges = getBridges(signer, buildAleoCoinConfig());
    accountBridge = bridges.accountBridge;

    return {
      currencyBridge: bridges.currencyBridge,
      accountBridge,
      account: makeAleoAccount(sender.address, sender.viewKey),
      // beforeSync seals a block on every retry, so 20 retries at 1 s converge
      // faster than the framework's 30 s default would.
      retryInterval: 1000,
      retryLimit: 20,
    };
  },

  // A devnode has no consensus, so beforeSync must seal the block itself on every
  // synchronization (retries included); a spare block is harmless, a missing one hangs until retryLimit.
  beforeSync: async () => {
    await advanceBlocks(1);
  },

  getTransactions: () => [sendMaxPublic],

  beforeAll: account => {
    expect(account.currency.id).toBe(ALEO.id);
    expect(account.balance.toNumber()).toBe(FUNDING_AMOUNT_MICROCREDITS);
    expect(account.freshAddress).toBe(sender.address);
  },

  afterAll: async account => {
    // Chain-level balances: the OUT side (sender) and the IN side (recipient,
    // unknown to the chain before this scenario funded and then drained into
    // it, so its balance is exactly the send-max amount).
    const senderChainBalance = await getPublicBalance(sender.address);
    expect(senderChainBalance).toBe(BigInt(account.balance.toFixed(0)));
    expect(senderChainBalance).toBeGreaterThan(0n);
    expect(await getPublicBalance(recipient.address)).toBe(
      BigInt(SEND_MAX_PUBLIC_AMOUNT_MICROCREDITS),
    );

    // Ledger Live's own view of the IN side: the harness only ever syncs
    // `sender` (the tracked account), so `recipient`'s operations are synced
    // by hand here, mirroring what sendMaxPublic.expect already checks for OUT.
    const recipientAccount = await firstValueFrom(
      accountBridge
        .sync(makeAleoAccount(recipient.address, recipient.viewKey), {
          paginationConfig: {},
        })
        .pipe(reduce((acc, f) => f(acc), makeAleoAccount(recipient.address, recipient.viewKey))),
    );

    expect(recipientAccount.operations).toHaveLength(1);
    const [latest] = recipientAccount.operations;
    expect(latest.type).toBe("IN");
    expect(latest.hasFailed).toBe(false);
    expect(latest.senders).toStrictEqual([sender.address]);
    expect(latest.recipients).toStrictEqual([recipient.address]);
    expect(latest.value).toStrictEqual(new BigNumber(SEND_MAX_PUBLIC_AMOUNT_MICROCREDITS));
    expect(recipientAccount.balance).toStrictEqual(
      new BigNumber(SEND_MAX_PUBLIC_AMOUNT_MICROCREDITS),
    );
  },

  // Closes only the mock server. The docker stack belongs to scenarii.test.ts,
  // and executeScenario calls teardown on both the success and the error path.
  teardown: () => {
    mockServer.close();
  },
};

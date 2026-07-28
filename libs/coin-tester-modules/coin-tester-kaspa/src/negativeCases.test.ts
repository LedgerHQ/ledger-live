import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import type { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { ONE_KAS, makeAccount, makeGenericAdapterAccount, initMSW } from "./fixtures";
import { getBridges } from "./helpers";
import { mineBlocks, waitForBalance, getBalance } from "./kaspaNode";
import { buildSigners, deriveAddress, KASPA_TEST_MNEMONIC, KASPA_RECIPIENT_MNEMONIC } from "./signer";

// Validation and craft errors the real Kaspa node enforces.
// executeScenario is happy-path only — it throws on any status error, so these can't be scenarios.
jest.setTimeout(180_000);

describe("Kaspa negative cases (simnet devnet)", () => {
  let legacyBridge: Awaited<ReturnType<typeof getBridges>>["accountBridge"];
  let genericBridge: Awaited<ReturnType<typeof getBridges>>["accountBridge"];
  let account: Account;
  let accountGeneric: Account;
  let recipient: string;
  let stopMSW: (() => void) | null = null;
  // Live fee buckets from prepareTransaction — needed so getFeeRate doesn't throw
  // "Invalid fee strategy provided" when getTransactionStatus is called without a prior prepare.
  let baseNetworkInfo: { label: string; amount: BigNumber; estimatedSeconds: number }[] = [];

  beforeAll(async () => {
    LiveConfig.setConfig({
      config_currency_kaspa: {
        type: "object",
        default: { status: { type: "active" } },
      },
    });

    stopMSW = initMSW();
    const testAddress = await deriveAddress(KASPA_TEST_MNEMONIC, 0, 0);
    recipient = await deriveAddress(KASPA_RECIPIENT_MNEMONIC, 0, 0);

    // Safety net: if scenarii.test.ts drained the account, mine fresh spendable UTXOs.
    // Change UTXOs from scenario sends are non-coinbase (immediately spendable), but
    // if the account is nearly empty we need more mature coinbase UTXOs (1200 blocks).
    const currentBalance = await getBalance(testAddress);
    if (currentBalance < BigInt(100 * ONE_KAS)) {
      await mineBlocks(1200, 50);
      await waitForBalance(testAddress, BigInt(100 * ONE_KAS), 120_000);
    }

    const signers = await buildSigners(KASPA_TEST_MNEMONIC);
    const legacy = await getBridges("legacy", signers);
    const generic = await getBridges("generic-adapter", signers);
    legacyBridge = legacy.accountBridge;
    genericBridge = generic.accountBridge;

    // Sync the legacy account so balance / UTXO cache reflects live on-chain state.
    const xpub = (await signers.bridge.getAddress("44'/111111'/0'/0/0")).publicKey;
    const legacyInitial = makeAccount(testAddress, xpub);
    account = await new Promise<Account>((resolve, reject) => {
      let acc: Account = legacyInitial;
      legacyBridge.sync(legacyInitial, { paginationConfig: {} }).subscribe({
        next: (update: (a: Account) => Account) => {
          acc = update(acc);
        },
        error: reject,
        complete: () => resolve(acc),
      });
    });
    expect(account.balance.gt(0)).toBe(true);

    // Fetch live fee buckets from the simnet so build() can produce transactions with
    // populated networkInfo. Without this, getFeeRate() throws "Invalid fee strategy
    // provided" because createTransaction() defaults networkInfo to [].
    const seedTx = await legacyBridge.prepareTransaction(
      account,
      legacyBridge.createTransaction(account),
    );
    baseNetworkInfo = (seedTx as unknown as { networkInfo: typeof baseNetworkInfo }).networkInfo;

    // Generic adapter account — address-based, no HD scan needed for crafting.
    accountGeneric = makeGenericAdapterAccount(testAddress);
  }, 180_000);

  afterAll(() => {
    stopMSW?.();
  });

  const build = (patch: Record<string, unknown>) =>
    legacyBridge.updateTransaction(legacyBridge.createTransaction(account), {
      networkInfo: baseNetworkInfo,
      ...patch,
    } as never);

  const buildGeneric = (patch: Record<string, unknown>) =>
    genericBridge.updateTransaction(genericBridge.createTransaction(accountGeneric), patch as never);

  it("flags insufficient funds (NotEnoughBalance) — legacy", async () => {
    const tx = build({ recipient, amount: account.balance.plus(10_000 * ONE_KAS) });
    const status = await legacyBridge.getTransactionStatus(account, tx);
    expect(status.errors.amount?.name).toBe("NotEnoughBalance");
  });

  it("flags a malformed recipient (InvalidAddress) — legacy", async () => {
    const tx = build({ recipient: "not-a-valid-kaspa-address", amount: new BigNumber(ONE_KAS) });
    const status = await legacyBridge.getTransactionStatus(account, tx);
    expect(status.errors.recipient?.name).toBe("InvalidAddress");
  });

  it("rejects a dust output via getTransactionStatus (DustLimit) — legacy", async () => {
    // 1 sompi < 0.2 KAS dust limit; getTransactionStatus.ts sets errors.dustLimit without crafting.
    const tx = build({ recipient, amount: new BigNumber(1) });
    const status = await legacyBridge.getTransactionStatus(account, tx);
    expect(status.errors.dustLimit?.name).toBe("DustLimit");
  });

  it("rejects a dust output via prepareTransaction (KIP-9 storage mass) — generic adapter", async () => {
    // 1 sompi causes KIP-9 storage mass overflow in selectUtxos, which throws an unhandled error.
    // This test documents the current behaviour: prepareTransaction should convert the selectUtxos
    // throw into a structured DustLimit / NotEnoughBalance error instead.
    const tx = buildGeneric({ recipient, amount: new BigNumber(1) });
    await expect(genericBridge.prepareTransaction(accountGeneric, tx)).rejects.toThrow();
  });
});

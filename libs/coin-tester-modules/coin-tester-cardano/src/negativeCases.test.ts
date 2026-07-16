import { CardanoMinAmountError } from "@ledgerhq/coin-cardano/errors";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { CardanoMinAmountError } from "@ledgerhq/coin-cardano/errors";
import type { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { CARDANO_TESTNET, FRESH_ADDRESS_PATH, makeAccount } from "./fixtures";
import { getBridges, TESTNET } from "./helpers";
import { buildSigner } from "./signer";
import { resetDevnet, sleep, topup } from "./yaci";
import { initYaciIndexer, registerAddress, resetRegisteredAddresses } from "./yaciIndexer";

// Validation/craft errors the real node + coin-cardano enforce but the in-memory mock could not.
// Uses the Yaci backend for a real synced balance; asserts getTransactionStatus errors directly
// (executeScenario is happy-path only — it throws on any status error, so these can't be scenarios).
jest.setTimeout(600_000);

// A mainnet (network tag 1) address — wrong network for the testnet account.
const MAINNET_RECIPIENT =
  "addr1qxqm3nxwzf70ke9jqa2zrtrevjznpv6yykptxnv34perjc8a7zgxmpv5pgk4hhhe0m9kfnlsf5pt7d2ahkxaul2zygrq3nura9";

// A cold devnet can make the first getAccountShape slow; bound each raw sync attempt and retry so a
// stalled sync fails fast/diagnosably instead of hanging to jest's 600s hook ceiling (this suite has
// no retry of its own, unlike the executeScenario the scenario suites run through).
const SYNC_ATTEMPT_TIMEOUT_MS = 60_000;
const SYNC_ATTEMPTS = 5;

async function syncFundedAccount(
  accountBridge: Awaited<ReturnType<typeof getBridges>>["accountBridge"],
  address: string,
): Promise<Account> {
  for (let attempt = 1; attempt <= SYNC_ATTEMPTS; attempt++) {
    const initial = makeAccount(address, CARDANO_TESTNET);
    // Fold the sync observable into a synced account without importing rxjs (not a direct dep).
    const synced = await new Promise<Account | null>(resolve => {
      let acc = initial;
      let subscription: { unsubscribe(): void } | undefined;
      const timer = setTimeout(() => {
        subscription?.unsubscribe();
        resolve(null);
      }, SYNC_ATTEMPT_TIMEOUT_MS);
      subscription = accountBridge.sync(initial, { paginationConfig: {} }).subscribe({
        next: (update: (a: Account) => Account) => {
          acc = update(acc);
        },
        error: () => {
          clearTimeout(timer);
          resolve(null);
        },
        complete: () => {
          clearTimeout(timer);
          resolve(acc);
        },
      });
    });
    if (synced && synced.balance.gt(0)) return synced;
    await sleep(2_000);
  }
  throw new Error(
    `negativeCases: account did not sync to a funded balance within ${SYNC_ATTEMPTS} attempts`,
  );
}

describe("Cardano negative cases (Yaci devnet)", () => {
  let closeIndexer: (() => void) | undefined;
  let accountBridge: Awaited<ReturnType<typeof getBridges>>["accountBridge"];
  let account: Account;
  let recipient = "";

  beforeAll(async () => {
    LiveConfig.setConfig({
      config_currency_cardano_testnet: {
        type: "object",
        default: { status: { type: "active" }, maxFeesWarning: 0, maxFeesError: 0 },
      },
    });
    await resetDevnet();

    const signer = await buildSigner();
    const bridges = await getBridges(signer, TESTNET);
    accountBridge = bridges.accountBridge;

    const { address } = await bridges.getAddress("", {
      path: FRESH_ADDRESS_PATH,
      currency: CARDANO_TESTNET,
      derivationMode: "",
    });
    recipient = (await signer.getAddress("1852'/1815'/1'/0/0", TESTNET.networkId)).address;
    registerAddress(address, TESTNET.networkId);
    await topup(address, 100);

    // Start MSW only after the devnet admin/faucet calls: it mocks the Strica sync API, and its
    // passthrough of :10000/:8080 drops the request AbortSignal — so topup routed through it can hang
    // the faucet POST indefinitely. Running topup first (pre-listen) keeps it a direct, abortable fetch.
    closeIndexer = initYaciIndexer();
    account = await syncFundedAccount(accountBridge, address);
    expect(account.balance.gt(0)).toBe(true);
  });

  afterAll(() => {
    closeIndexer?.();
    resetRegisteredAddresses();
  });

  const build = (patch: Record<string, unknown>) =>
    accountBridge.updateTransaction(accountBridge.createTransaction(account), patch as never);

  it("flags insufficient funds (NotEnoughBalance)", async () => {
    const tx = build({ recipient, amount: account.balance.plus(1_000_000_000) });
    const status = await accountBridge.getTransactionStatus(account, tx);
    expect(status.errors.amount?.name).toBe("NotEnoughBalance");
  });

  it("flags a wrong-network (mainnet) recipient (InvalidAddress)", async () => {
    const tx = build({ recipient: MAINNET_RECIPIENT, amount: new BigNumber(2_000_000) });
    const status = await accountBridge.getTransactionStatus(account, tx);
    expect(status.errors.recipient?.name).toBe("InvalidAddress");
  });

  it("rejects a below-min-UTXO amount at craft", async () => {
    const tx = build({ recipient, amount: new BigNumber(100), nonce: 0 });
    await expect(accountBridge.prepareTransaction(account, tx)).rejects.toThrow(
      CardanoMinAmountError,
    );
  });
});

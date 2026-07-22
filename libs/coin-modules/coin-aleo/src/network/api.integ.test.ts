import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import aleoConfig from "../config";
import { getTestnetIntegConfig } from "../__tests__/fixtures/config.fixture";
import {
  referenceTransferPublicTx,
  TEST_TOKEN_PROGRAM_ID,
  testnetAddress,
} from "../__tests__/fixtures/api.fixture";
import { getPristineAccount } from "../__tests__/helpers/account";
import { apiClient } from "./api";

const currency = getCryptoCurrencyById("aleo_testnet");
let emptyAddress: string;

beforeAll(async () => {
  aleoConfig.setCoinConfig(() => getTestnetIntegConfig());
  const pristineAccount = await getPristineAccount();
  emptyAddress = pristineAccount.address;
});

describe("getLatestBlock", () => {
  it("returns a block with a positive height and valid hashes", async () => {
    const block = await apiClient.getLatestBlock(currency);

    expect(block.header.metadata.height).toBeGreaterThan(0);
    expect(typeof block.header.metadata.timestamp).toBe("number");
    expect(block.block_hash).toMatch(/^ab1[a-z0-9]+$/);
    expect(block.previous_hash).toMatch(/^ab1[a-z0-9]+$/);
  });
});

describe("getAccountBalance", () => {
  it("returns a u64 balance string for an account with public funds", async () => {
    const balance = await apiClient.getAccountBalance(currency, testnetAddress);

    expect(typeof balance).toBe("string");
    expect(balance).toMatch(/^\d+u64$/);
  });

  it("returns null for an account with no public credits balance", async () => {
    const balance = await apiClient.getAccountBalance(currency, emptyAddress);

    expect(balance).toBeNull();
  });
});

describe("getTokenBalance", () => {
  it("returns the raw balance string for a known account holding the token", async () => {
    const balance = await apiClient.getTokenBalance(
      currency,
      TEST_TOKEN_PROGRAM_ID,
      testnetAddress,
    );

    expect(typeof balance).toBe("string");
    expect(balance).toMatch(/^\d+u128$/);
  });

  it("returns null for an account with no balance for that token", async () => {
    const balance = await apiClient.getTokenBalance(currency, TEST_TOKEN_PROGRAM_ID, emptyAddress);

    expect(balance).toBeNull();
  });

  it("returns null for a program that doesn't exist", async () => {
    const balance = await apiClient.getTokenBalance(
      currency,
      "totally_unknown_program_xyz.aleo",
      testnetAddress,
    );

    expect(balance).toBeNull();
  });

  it("throws for a malformed address", async () => {
    await expect(
      apiClient.getTokenBalance(currency, TEST_TOKEN_PROGRAM_ID, "invalid_address"),
    ).rejects.toMatchObject({ name: "LedgerAPI4xx", status: 404 });
  });
});

describe("getTransactionById", () => {
  it("returns full details for a known accepted transaction", async () => {
    const tx = await apiClient.getTransactionById(currency, referenceTransferPublicTx.id);

    expect(tx.id).toBe(referenceTransferPublicTx.id);
    expect(tx.status).toBe("Accepted");
    expect(tx.block_height).toBe(referenceTransferPublicTx.blockHeight);
    expect(tx.block_hash).toBe(referenceTransferPublicTx.blockHash);
    expect(tx.type).toBe("execute");
    expect(typeof tx.fee_value).toBe("number");
    expect(tx.fee_value).toBeGreaterThan(0);
  });

  it("throws for an unknown transaction id", async () => {
    await expect(
      apiClient.getTransactionById(
        currency,
        "at1unknowntransactionidthatdoesnotexistonthechain0000000000000000",
      ),
    ).rejects.toMatchObject({ name: "LedgerAPI4xx", status: 404 });
  });
});

describe("getAccountPublicTransactions", () => {
  it("returns transactions list and address for an active account", async () => {
    const result = await apiClient.getAccountPublicTransactions({
      currency,
      address: testnetAddress,
    });

    expect(result.address).toBe(testnetAddress);
    expect(Array.isArray(result.transactions)).toBe(true);
    expect(result.transactions.length).toBeGreaterThan(0);

    const tx = result.transactions[0];
    expect(tx.transaction_id).toMatch(/^at1[a-z0-9]+$/);
    expect(typeof tx.block_number).toBe("number");
    expect(tx.block_number).toBeGreaterThan(0);
    expect(["Accepted", "Rejected"]).toContain(tx.transaction_status);
  });

  it("returns transactions in descending block order when order=desc", async () => {
    const result = await apiClient.getAccountPublicTransactions({
      currency,
      address: testnetAddress,
      order: "desc",
      limit: 10,
    });

    expect(result.transactions.length).toBeGreaterThan(1);

    const heights = result.transactions.map(tx => tx.block_number);
    for (let i = 0; i < heights.length - 1; i++) {
      expect(heights[i]).toBeGreaterThanOrEqual(heights[i + 1]);
    }
  });

  it("respects the limit parameter", async () => {
    const result = await apiClient.getAccountPublicTransactions({
      currency,
      address: testnetAddress,
      limit: 3,
    });

    expect(result.transactions.length).toBeLessThanOrEqual(3);
  });

  it("returns a next_cursor for pagination when limit is smaller than total", async () => {
    const result = await apiClient.getAccountPublicTransactions({
      currency,
      address: testnetAddress,
      limit: 3,
      order: "asc",
    });

    expect(typeof result.next_cursor?.block_number).toBe("number");
    expect(typeof result.next_cursor?.transition_id).toBe("string");
  });

  it("returns empty transactions list for an account with no activity", async () => {
    const result = await apiClient.getAccountPublicTransactions({
      currency,
      address: emptyAddress,
    });

    expect(result.address).toBe(emptyAddress);
    expect(result.transactions).toHaveLength(0);
  });
});

describe("getScannerPublicKey", () => {
  it("returns a non-empty key_id and public_key", async () => {
    const result = await apiClient.getScannerPublicKey(currency);

    expect(typeof result.key_id).toBe("string");
    expect(result.key_id.length).toBeGreaterThan(0);
    expect(typeof result.public_key).toBe("string");
    expect(result.public_key.length).toBeGreaterThan(0);
  });
});

describe("getProvePublicKey", () => {
  it("returns a non-empty key_id and public_key", async () => {
    const { data } = await apiClient.getProvePublicKey({ currency });

    expect(typeof data.key_id).toBe("string");
    expect(data.key_id.length).toBeGreaterThan(0);
    expect(typeof data.public_key).toBe("string");
    expect(data.public_key.length).toBeGreaterThan(0);
  });

  it("returns stickySessionCookie as an array or null", async () => {
    const { stickySessionCookie } = await apiClient.getProvePublicKey({ currency });

    expect(stickySessionCookie === null || Array.isArray(stickySessionCookie)).toBe(true);
  });
});

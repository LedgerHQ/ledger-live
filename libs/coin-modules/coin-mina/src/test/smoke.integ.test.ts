/**
 * Smoke tests hitting the real Mina network.
 * NOT meant for CI -- run manually via `pnpm test-integ` to verify
 * real backend connectivity.
 */

import { minaDefaults, setCoinConfig } from "../config";
import { getAccount } from "../logic/account/getAccount";
import { fetchTransactionMetadata } from "../network";

const VALID_ADDRESS = "B62qjWLs1W3J2fFGixeX49w1o7VvSGuMBNotnFhzs3PZ7PbtdFbhdeD";
const DEST_ADDRESS = "B62qkWcHhoisWDCR7v3gvWzX6wXEVuGYLHXq3mSym4GEzfYXmSDv314";

describe("Mina smoke tests (real network)", () => {
  beforeAll(() => {
    setCoinConfig(() => minaDefaults.mina);
  });

  it("should fetch a non-zero balance for a known address", async () => {
    const account = await getAccount(VALID_ADDRESS);
    expect(account.balance.toNumber()).toBeGreaterThan(0);
  }, 60_000);

  it("should fetch transaction metadata with suggested fees", async () => {
    const metadata = await fetchTransactionMetadata(
      VALID_ADDRESS,
      DEST_ADDRESS,
      10000000,
      10000000,
    );
    expect(metadata.suggested_fee).toHaveLength(1);
  }, 60_000);
});

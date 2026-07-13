import { estimateFees } from "./estimateFees";

// Dedicated, independently-funded Kaspa account (see getBalance.integ.test.ts) — funded once and
// never spent, so it keeps spendable UTXOs for the fee estimation below.
const FUNDED_SENDER = "kaspa:qz24c4tse54c2f9v02ap2l3957uw5kq3rdg960gvw50wtvvy0nxax5jt8zckp";
const RECIPIENT = "kaspa:qyp8y7hlk9uj5l9vqsyz78x90yt84cujdytg93s8q8malhpdq6c4hpg9dyesk65";

describe("estimateFees (integration)", () => {
  it("estimates a positive fee for a valid send (api.mdx: value > 0, no error)", async () => {
    const fees = await estimateFees({
      intentType: "transaction",
      type: "send",
      sender: FUNDED_SENDER,
      recipient: RECIPIENT,
      amount: 100_000_000n, // 1 KAS — leaves a large change output, clear of the storage-mass floor
      asset: { type: "native" },
    });

    expect(typeof fees.value).toBe("bigint");
    expect(fees.value).toBeGreaterThan(0n);
  });
});

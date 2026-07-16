import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import * as bech32 from "bech32";
import BigNumber from "bignumber.js";
import getTransactionStatus from "./getTransactionStatus";
import { CosmosAccount, Transaction } from "./types";

// Status-level negative cases for getTransactionStatus. This is pure in-memory
// logic — no network call, no signer — so it lives here as a coin-cosmos unit
// test rather than in the coin-tester (which only exercises the live devnet
// happy path). They guard the rejections a user can hit before signing: bad
// amount, bad recipient, not enough balance.
const babylon = getCryptoCurrencyById("babylon");

// 1 BABY = 1e6 ubbn (the base unit getTransactionStatus works in). Accept a
// string so non-integer amounts parse exactly (no JS float rounding).
const BABY = (n: string | number): BigNumber => new BigNumber(n).times(1e6);

// A well-formed bbn1… address with a valid checksum, built rather than
// hardcoded so the test never carries a stale/mistyped bech32 string. Address
// validation only checks the `bbn` prefix + decodability, so the 20 payload
// bytes are arbitrary.
const validRecipient = bech32.encode("bbn", bech32.toWords(Buffer.alloc(20, 1)));

const makeAccount = (spendableBalance: BigNumber): CosmosAccount =>
  ({
    type: "Account",
    currency: babylon,
    // Distinct from validRecipient so the send checks reach the amount/balance
    // branch instead of short-circuiting on destination-is-source.
    freshAddress: bech32.encode("bbn", bech32.toWords(Buffer.alloc(20, 2))),
    balance: spendableBalance,
    spendableBalance,
    cosmosResources: {
      delegations: [],
      redelegations: [],
      unbondings: [],
      delegatedBalance: new BigNumber(0),
      pendingRewardsBalance: new BigNumber(0),
      unbondingBalance: new BigNumber(0),
      withdrawAddress: "",
      sequence: 0,
    },
  }) as unknown as CosmosAccount;

describe("getTransactionStatus negative cases", () => {
  it("rejects a send above the spendable balance with NotEnoughBalance", async () => {
    const account = makeAccount(BABY(1));
    const transaction = {
      mode: "send",
      recipient: validRecipient,
      amount: BABY(1000), // far more than the 1 BABY spendable balance
      fees: new BigNumber(5000),
      validators: [],
      useAllAmount: false,
    } as unknown as Transaction;
    const status = await getTransactionStatus(account, transaction);
    expect(status.errors.amount?.name).toBe("NotEnoughBalance");
  });

  it("rejects a malformed recipient address with InvalidAddress", async () => {
    const account = makeAccount(BABY(1));
    const transaction = {
      mode: "send",
      // No bech32 separator → fails decode → InvalidAddress, independent of hrp.
      recipient: "not-a-valid-cosmos-address",
      amount: BABY("0.1"),
      fees: new BigNumber(5000),
      validators: [],
      useAllAmount: false,
    } as unknown as Transaction;
    const status = await getTransactionStatus(account, transaction);
    expect(status.errors.recipient?.name).toBe("InvalidAddress");
  });

  it("rejects a zero-amount delegate with AmountRequired", async () => {
    const account = makeAccount(BABY(1));
    const transaction = {
      mode: "delegate",
      amount: new BigNumber(0),
      validators: [{ address: "bbnvaloper1validator", amount: new BigNumber(0) }],
      fees: new BigNumber(5000),
      useAllAmount: false,
    } as unknown as Transaction;
    const status = await getTransactionStatus(account, transaction);
    expect(status.errors.amount?.name).toBe("AmountRequired");
  });

  it("rejects a delegate with no validators with InvalidAddress", async () => {
    const account = makeAccount(BABY(1));
    const transaction = {
      mode: "delegate",
      amount: BABY(1),
      validators: [],
      fees: new BigNumber(5000),
      useAllAmount: false,
    } as unknown as Transaction;
    const status = await getTransactionStatus(account, transaction);
    expect(status.errors.recipient?.name).toBe("InvalidAddress");
  });
});

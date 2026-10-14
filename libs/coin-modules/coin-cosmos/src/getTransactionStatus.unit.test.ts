import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import * as bech32 from "bech32";
import BigNumber from "bignumber.js";
import getTransactionStatus from "./getTransactionStatus";
import { CosmosAccount, Transaction } from "./types";
import { COSMOS_MAX_REDELEGATIONS, getMaxEstimatedBalance } from "./logic";

// Status-level negative cases for getTransactionStatus. This is pure in-memory
// logic — no network call, no signer — so it lives here as a coin-cosmos unit
// test rather than in the coin-tester (which only exercises the live devnet
// happy path). They guard the rejections a user can hit before signing: bad
// amount, bad recipient, not enough balance.
const babylon = getCryptoCurrencyById("babylon");
const gonka = getCryptoCurrencyById("gonka");

// 1 BABY = 1e6 ubbn (the base unit getTransactionStatus works in). Accept a
// string so non-integer amounts parse exactly (no JS float rounding).
const BABY = (n: string | number): BigNumber => new BigNumber(n).times(1e6);

// A well-formed bbn1… address with a valid checksum, built rather than
// hardcoded so the test never carries a stale/mistyped bech32 string. Address
// validation only checks the `bbn` prefix + decodability, so the 20 payload
// bytes are arbitrary.
const validRecipient = bech32.encode("bbn", bech32.toWords(Buffer.alloc(20, 1)));

const makeAccount = (
  spendableBalance: BigNumber,
  currency = babylon,
  stakingOverrides: Partial<CosmosAccount["stakingResources"]> = {},
): CosmosAccount =>
  ({
    type: "Account",
    currency,
    // Distinct from validRecipient so the send checks reach the amount/balance
    // branch instead of short-circuiting on destination-is-source.
    freshAddress: bech32.encode(
      currency.id === "gonka" ? "gonka" : "bbn",
      bech32.toWords(Buffer.alloc(20, 2)),
    ),
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
    stakingResources: {
      delegations: [],
      redelegations: [],
      unbondings: [],
      delegatedBalance: new BigNumber(0),
      pendingRewardsBalance: new BigNumber(0),
      unbondingBalance: new BigNumber(0),
      ...stakingOverrides,
    },
  }) as unknown as CosmosAccount;

// bbnvaloper1… validator addresses, built the same way as validRecipient — real prefix,
// arbitrary payload, so isDelegable/redelegation checks reach their intended branch.
const validator1 = bech32.encode("bbnvaloper", bech32.toWords(Buffer.alloc(20, 3)));
const validator2 = bech32.encode("bbnvaloper", bech32.toWords(Buffer.alloc(20, 4)));

// A well-formed gonka1… recipient, built the same way as validRecipient above.
const validGonkaRecipient = bech32.encode("gonka", bech32.toWords(Buffer.alloc(20, 1)));

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

describe("getTransactionStatus zero-fee chain (gonka)", () => {
  it("treats a zero fee as loaded and spends the full balance with useAllAmount", async () => {
    const spendableBalance = BABY(10);
    const account = makeAccount(spendableBalance, gonka);
    const transaction = {
      mode: "send",
      recipient: validGonkaRecipient,
      amount: new BigNumber(0),
      fees: new BigNumber(0),
      gas: new BigNumber(80000),
      validators: [],
      useAllAmount: true,
    } as unknown as Transaction;

    const status = await getTransactionStatus(account, transaction);

    expect(status.errors.fees).toBeUndefined();
    expect(status.amount).toEqual(getMaxEstimatedBalance(account, new BigNumber(0)));
    expect(status.amount).toEqual(spendableBalance);
  });

  it("still flags FeeNotLoaded when fees have not been computed yet", async () => {
    const account = makeAccount(BABY(10), gonka);
    const transaction = {
      mode: "send",
      recipient: validGonkaRecipient,
      amount: BABY(1),
      fees: null,
      gas: new BigNumber(80000),
      validators: [],
      useAllAmount: false,
    } as unknown as Transaction;

    const status = await getTransactionStatus(account, transaction);

    expect(status.errors.fees?.name).toBe("FeeNotLoaded");
  });
});

describe("getTransactionStatus send: RecommendUndelegation warning", () => {
  it("warns when useAllAmount is set and the account has active delegations", async () => {
    const account = makeAccount(BABY(10), babylon, {
      delegations: [
        {
          validatorAddress: validator1,
          amount: BABY(5),
          pendingRewards: new BigNumber(0),
          status: "bonded",
        },
      ],
    });
    const transaction = {
      mode: "send",
      recipient: validRecipient,
      amount: new BigNumber(0),
      fees: new BigNumber(5000),
      validators: [],
      useAllAmount: true,
    } as unknown as Transaction;

    const status = await getTransactionStatus(account, transaction);

    expect(status.warnings.amount?.name).toBe("RecommendUndelegation");
  });

  it("does not warn when the account has no delegations", async () => {
    const account = makeAccount(BABY(10));
    const transaction = {
      mode: "send",
      recipient: validRecipient,
      amount: new BigNumber(0),
      fees: new BigNumber(5000),
      validators: [],
      useAllAmount: true,
    } as unknown as Transaction;

    const status = await getTransactionStatus(account, transaction);

    expect(status.warnings.amount).toBeUndefined();
  });
});

describe("getTransactionStatus delegate: resolveTransactionValidators via valAddress", () => {
  it("accepts a delegate transaction described by valAddress instead of the validators array", async () => {
    const account = makeAccount(BABY(10));
    const transaction = {
      mode: "delegate",
      amount: BABY(1),
      valAddress: validator1,
      fees: new BigNumber(5000),
      useAllAmount: false,
    } as unknown as Transaction;

    const status = await getTransactionStatus(account, transaction);

    expect(status.errors.recipient).toBeUndefined();
    expect(status.errors.amount).toBeUndefined();
  });
});

describe("getTransactionStatus undelegate", () => {
  it("rejects undelegating more than the current delegation with NotEnoughDelegationBalance", async () => {
    const account = makeAccount(BABY(10), babylon, {
      delegations: [
        {
          validatorAddress: validator1,
          amount: BABY(1),
          pendingRewards: new BigNumber(0),
          status: "bonded",
        },
      ],
    });
    const transaction = {
      mode: "undelegate",
      amount: BABY(5),
      validators: [{ address: validator1, amount: BABY(5) }],
      fees: new BigNumber(5000),
      useAllAmount: false,
    } as unknown as Transaction;

    const status = await getTransactionStatus(account, transaction);

    expect(status.errors.unbonding?.name).toBe("NotEnoughDelegationBalance");
  });

  it("accepts undelegating up to the current delegation amount", async () => {
    const account = makeAccount(BABY(10), babylon, {
      delegations: [
        {
          validatorAddress: validator1,
          amount: BABY(5),
          pendingRewards: new BigNumber(0),
          status: "bonded",
        },
      ],
    });
    const transaction = {
      mode: "undelegate",
      amount: BABY(2),
      validators: [{ address: validator1, amount: BABY(2) }],
      fees: new BigNumber(5000),
      useAllAmount: false,
    } as unknown as Transaction;

    const status = await getTransactionStatus(account, transaction);

    expect(status.errors.unbonding).toBeUndefined();
  });

  it("rejects an undelegate with no validators with InvalidAddress, resolved via valAddress", async () => {
    const account = makeAccount(BABY(10));
    const transaction = {
      mode: "undelegate",
      amount: BABY(1),
      validators: [],
      fees: new BigNumber(5000),
      useAllAmount: false,
    } as unknown as Transaction;

    const status = await getTransactionStatus(account, transaction);

    expect(status.errors.recipient?.name).toBe("InvalidAddress");
  });
});

describe("getTransactionStatus redelegate", () => {
  const baseRedelegate = {
    mode: "redelegate",
    amount: BABY(2),
    fees: new BigNumber(5000),
    useAllAmount: false,
  };

  it("accepts a well-formed redelegation with enough delegated balance on the source validator", async () => {
    const account = makeAccount(BABY(10), babylon, {
      delegations: [
        {
          validatorAddress: validator1,
          amount: BABY(5),
          pendingRewards: new BigNumber(0),
          status: "bonded",
        },
      ],
    });
    const transaction = {
      ...baseRedelegate,
      sourceValidator: validator1,
      validators: [{ address: validator2, amount: BABY(2) }],
    } as unknown as Transaction;

    const status = await getTransactionStatus(account, transaction);

    expect(status.errors.redelegation).toBeUndefined();
  });

  it("rejects when the account already has the maximum number of redelegations", async () => {
    const redelegations = Array.from({ length: COSMOS_MAX_REDELEGATIONS }).map((_, i) => ({
      validatorSrcAddress: validator1,
      validatorDstAddress: `${validator2}-${i}`,
      amount: BABY(1),
      completionDate: new Date(Date.now() - 1000),
    }));
    const account = makeAccount(BABY(10), babylon, {
      delegations: [
        {
          validatorAddress: validator1,
          amount: BABY(5),
          pendingRewards: new BigNumber(0),
          status: "bonded",
        },
      ],
      redelegations,
    });
    const transaction = {
      ...baseRedelegate,
      sourceValidator: validator1,
      validators: [{ address: validator2, amount: BABY(2) }],
    } as unknown as Transaction;

    const status = await getTransactionStatus(account, transaction);

    expect(status.errors.redelegation?.name).toBe("CosmosTooManyRedelegations");
  });

  it("rejects redelegating to a validator that already has an in-progress redelegation from the source", async () => {
    const account = makeAccount(BABY(10), babylon, {
      delegations: [
        {
          validatorAddress: validator1,
          amount: BABY(5),
          pendingRewards: new BigNumber(0),
          status: "bonded",
        },
      ],
      redelegations: [
        {
          validatorSrcAddress: validator2,
          validatorDstAddress: validator1,
          amount: BABY(1),
          completionDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        },
      ],
    });
    const transaction = {
      ...baseRedelegate,
      sourceValidator: validator1,
      validators: [{ address: validator2, amount: BABY(2) }],
    } as unknown as Transaction;

    const status = await getTransactionStatus(account, transaction);

    expect(status.errors.redelegation?.name).toBe("CosmosRedelegationInProgress");
  });

  it("rejects redelegating to the same validator as the source", async () => {
    const account = makeAccount(BABY(10), babylon, {
      delegations: [
        {
          validatorAddress: validator1,
          amount: BABY(5),
          pendingRewards: new BigNumber(0),
          status: "bonded",
        },
      ],
    });
    const transaction = {
      ...baseRedelegate,
      sourceValidator: validator1,
      validators: [{ address: validator1, amount: BABY(2) }],
    } as unknown as Transaction;

    const status = await getTransactionStatus(account, transaction);

    expect(status.errors.redelegation?.name).toBe("InvalidAddressBecauseDestinationIsAlsoSource");
  });

  it("rejects redelegating more than the delegated amount on the source validator", async () => {
    const account = makeAccount(BABY(10), babylon, {
      delegations: [
        {
          validatorAddress: validator1,
          amount: BABY(1),
          pendingRewards: new BigNumber(0),
          status: "bonded",
        },
      ],
    });
    const transaction = {
      ...baseRedelegate,
      sourceValidator: validator1,
      validators: [{ address: validator2, amount: BABY(5) }],
    } as unknown as Transaction;

    const status = await getTransactionStatus(account, transaction);

    expect(status.errors.redelegation?.name).toBe("NotEnoughDelegationBalance");
  });

  it("resolves source/destination validators from valAddress/dstValAddress instead of the legacy fields", async () => {
    const account = makeAccount(BABY(10), babylon, {
      delegations: [
        {
          validatorAddress: validator1,
          amount: BABY(5),
          pendingRewards: new BigNumber(0),
          status: "bonded",
        },
      ],
    });
    const transaction = {
      mode: "redelegate",
      amount: BABY(2),
      fees: new BigNumber(5000),
      useAllAmount: false,
      valAddress: validator1,
      dstValAddress: validator2,
    } as unknown as Transaction;

    const status = await getTransactionStatus(account, transaction);

    expect(status.errors.redelegation).toBeUndefined();
    expect(status.errors.recipient).toBeUndefined();
  });
});

describe("getTransactionStatus claimReward / claimRewardCompound / compoundReward", () => {
  it("warns when fees exceed the pending rewards on claimReward", async () => {
    const account = makeAccount(BABY(10), babylon, {
      delegations: [
        {
          validatorAddress: validator1,
          amount: BABY(5),
          pendingRewards: new BigNumber(100),
          status: "bonded",
        },
      ],
    });
    const transaction = {
      mode: "claimReward",
      amount: new BigNumber(0),
      validators: [{ address: validator1, amount: new BigNumber(0) }],
      fees: new BigNumber(200),
      useAllAmount: false,
    } as unknown as Transaction;

    const status = await getTransactionStatus(account, transaction);

    expect(status.warnings.claimReward?.name).toBe("ClaimRewardsFeesWarning");
  });

  it("does not warn when the pending rewards cover the fees", async () => {
    const account = makeAccount(BABY(10), babylon, {
      delegations: [
        {
          validatorAddress: validator1,
          amount: BABY(5),
          pendingRewards: new BigNumber(1000),
          status: "bonded",
        },
      ],
    });
    const transaction = {
      mode: "claimReward",
      amount: new BigNumber(0),
      validators: [{ address: validator1, amount: new BigNumber(0) }],
      fees: new BigNumber(200),
      useAllAmount: false,
    } as unknown as Transaction;

    const status = await getTransactionStatus(account, transaction);

    expect(status.warnings.claimReward).toBeUndefined();
  });

  it("also warns on compoundReward, resolved via valAddress", async () => {
    const account = makeAccount(BABY(10), babylon, {
      delegations: [
        {
          validatorAddress: validator1,
          amount: BABY(5),
          pendingRewards: new BigNumber(100),
          status: "bonded",
        },
      ],
    });
    const transaction = {
      mode: "compoundReward",
      amount: BABY(1),
      valAddress: validator1,
      fees: new BigNumber(200),
      useAllAmount: false,
    } as unknown as Transaction;

    const status = await getTransactionStatus(account, transaction);

    expect(status.warnings.claimReward?.name).toBe("ClaimRewardsFeesWarning");
  });
});

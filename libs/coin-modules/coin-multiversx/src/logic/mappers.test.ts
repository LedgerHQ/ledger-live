import {
  mapToBalance,
  mapToEsdtBalance,
  mapToOperation,
  mapToStake,
  mapToValidator,
} from "./mappers";
import type {
  ESDTToken,
  MultiversXApiTransaction,
  MultiversXDelegation,
  MultiversXProvider,
} from "../types";
import { MultiversXTransferOptions } from "../types";
import BigNumber from "bignumber.js";

describe("mapToBalance", () => {
  it("maps positive balance string to correct bigint", () => {
    const result = mapToBalance("1000000000000000000");

    expect(result).toEqual({
      value: 1000000000000000000n,
      asset: { type: "native" },
    });
  });

  it("maps '0' to 0n bigint", () => {
    const result = mapToBalance("0");

    expect(result).toEqual({
      value: 0n,
      asset: { type: "native" },
    });
  });

  it("handles large balance values correctly", () => {
    // 1 billion EGLD in smallest units (18 decimals)
    const largeBalance = "1000000000000000000000000000";
    const result = mapToBalance(largeBalance);

    expect(result).toEqual({
      value: BigInt(largeBalance),
      asset: { type: "native" },
    });
  });

  it("returns native asset type", () => {
    const result = mapToBalance("12345");

    expect(result.asset).toEqual({ type: "native" });
  });
});

describe("mapToEsdtBalance", () => {
  it("maps ESDT token to Balance with esdt asset type", () => {
    const token: ESDTToken = {
      identifier: "USDC-c76f1f",
      name: "WrappedUSDC",
      balance: "1000000",
    };

    const result = mapToEsdtBalance(token);

    expect(result).toEqual({
      value: 1000000n,
      asset: {
        type: "esdt",
        assetReference: "USDC-c76f1f",
        name: "WrappedUSDC",
      },
    });
  });

  it("correctly maps token identifier to assetReference", () => {
    const token: ESDTToken = {
      identifier: "MEX-455c57",
      name: "MEX",
      balance: "5000000000000000000",
    };

    const result = mapToEsdtBalance(token);

    expect(result.asset).toEqual({
      type: "esdt",
      assetReference: "MEX-455c57",
      name: "MEX",
    });
  });

  it("correctly maps token name to asset.name", () => {
    const token: ESDTToken = {
      identifier: "WEGLD-bd4d79",
      name: "WrappedEGLD",
      balance: "100000000000000000",
    };

    const result = mapToEsdtBalance(token);

    expect(result.asset).toHaveProperty("name", "WrappedEGLD");
  });

  it("handles large token balance values correctly", () => {
    const largeBalance = "999999999999999999999999999";
    const token: ESDTToken = {
      identifier: "RIDE-7d18e9",
      name: "holoride",
      balance: largeBalance,
    };

    const result = mapToEsdtBalance(token);

    expect(result.value).toEqual(BigInt(largeBalance));
  });

  it("handles zero token balance", () => {
    const token: ESDTToken = {
      identifier: "LKMEX-aab910",
      name: "LockedMEX",
      balance: "0",
    };

    const result = mapToEsdtBalance(token);

    expect(result.value).toEqual(0n);
  });
});

describe("mapToOperation", () => {
  const testAddress = "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th";
  const otherAddress = "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx";

  const createTransaction = (
    overrides: Partial<MultiversXApiTransaction> = {},
  ): MultiversXApiTransaction => ({
    mode: "send",
    fees: new BigNumber("50000000000000"),
    txHash: "abc123def456",
    sender: otherAddress,
    receiver: testAddress,
    value: new BigNumber("1000000000000000000"),
    blockHeight: 12345678,
    round: 12345678,
    timestamp: 1700000000,
    status: "success",
    gasLimit: 50000,
    ...overrides,
  });

  it("maps transaction hash to Operation.id", () => {
    const tx = createTransaction({ txHash: "unique-tx-hash-123" });

    const result = mapToOperation(tx, testAddress);

    expect(result.id).toBe("unique-tx-hash-123");
  });

  it("maps IN operation when address is receiver", () => {
    const tx = createTransaction({
      sender: otherAddress,
      receiver: testAddress,
    });

    const result = mapToOperation(tx, testAddress);

    expect(result.type).toBe("IN");
  });

  it("maps OUT operation when address is sender", () => {
    const tx = createTransaction({
      sender: testAddress,
      receiver: otherAddress,
    });

    const result = mapToOperation(tx, testAddress);

    expect(result.type).toBe("OUT");
  });

  it("maps transaction with failed status correctly", () => {
    const tx = createTransaction({ status: "fail" });

    const result = mapToOperation(tx, testAddress);

    expect(result.tx.failed).toBe(true);
  });

  it("maps transaction with success status as not failed", () => {
    const tx = createTransaction({ status: "success" });

    const result = mapToOperation(tx, testAddress);

    expect(result.tx.failed).toBe(false);
  });

  it("maps transaction with zero value", () => {
    const tx = createTransaction({ value: new BigNumber("0") });

    const result = mapToOperation(tx, testAddress);

    expect(result.value).toBe(0n);
  });

  it("maps transaction value to bigint correctly", () => {
    const tx = createTransaction({ value: new BigNumber("5000000000000000000") });

    const result = mapToOperation(tx, testAddress);

    expect(result.value).toBe(5000000000000000000n);
  });

  it("maps transaction fee to Operation.tx.fees as bigint", () => {
    const tx = createTransaction({ fee: new BigNumber("100000000000000") });

    const result = mapToOperation(tx, testAddress);

    expect(result.tx.fees).toBe(100000000000000n);
  });

  it("maps round to Operation.tx.block.height", () => {
    const tx = createTransaction({ round: 98765432 });

    const result = mapToOperation(tx, testAddress);

    expect(result.tx.block.height).toBe(98765432);
  });

  it("maps timestamp to Operation.tx.date as Date object", () => {
    const tx = createTransaction({ timestamp: 1700000000 });

    const result = mapToOperation(tx, testAddress);

    expect(result.tx.date).toEqual(new Date(1700000000 * 1000));
  });

  it("maps timestamp to Operation.tx.block.time as Date object", () => {
    const tx = createTransaction({ timestamp: 1700000000 });

    const result = mapToOperation(tx, testAddress);

    expect(result.tx.block.time).toEqual(new Date(1700000000 * 1000));
  });

  it("maps sender to Operation.senders array", () => {
    const tx = createTransaction({ sender: otherAddress });

    const result = mapToOperation(tx, testAddress);

    expect(result.senders).toEqual([otherAddress]);
  });

  it("maps receiver to Operation.recipients array", () => {
    const tx = createTransaction({ receiver: testAddress });

    const result = mapToOperation(tx, testAddress);

    expect(result.recipients).toEqual([testAddress]);
  });

  it("maps native EGLD to asset.type === 'native'", () => {
    const tx = createTransaction();

    const result = mapToOperation(tx, testAddress);

    expect(result.asset).toEqual({ type: "native" });
  });

  it("maps transaction hash to Operation.tx.hash", () => {
    const tx = createTransaction({ txHash: "unique-hash-xyz" });

    const result = mapToOperation(tx, testAddress);

    expect(result.tx.hash).toBe("unique-hash-xyz");
  });

  it("handles self-transfer (same sender and receiver) as OUT", () => {
    const tx = createTransaction({
      sender: testAddress,
      receiver: testAddress,
    });

    const result = mapToOperation(tx, testAddress);

    // Self-transfers are typically treated as OUT
    expect(result.type).toBe("OUT");
  });

  it("handles undefined fee by using fees field or defaulting to 0", () => {
    const tx = createTransaction({ fee: undefined, fees: new BigNumber("75000000000000") });

    const result = mapToOperation(tx, testAddress);

    expect(result.tx.fees).toBe(75000000000000n);
  });

  it("handles fee as string value", () => {
    // Tests toBigInt with string input
    const tx = createTransaction({ fee: "50000000000000" as unknown as typeof BigNumber.prototype });

    const result = mapToOperation(tx, testAddress);

    expect(result.tx.fees).toBe(50000000000000n);
  });

  it("handles fee as number value", () => {
    // Tests toBigInt with number input (small values for testing)
    const tx = createTransaction({ fee: 1000000 as unknown as typeof BigNumber.prototype });

    const result = mapToOperation(tx, testAddress);

    expect(result.tx.fees).toBe(1000000n);
  });

  it("handles value as string value", () => {
    // Tests toBigInt with string input for value field
    const tx = createTransaction({ value: "2000000000000000000" as unknown as typeof BigNumber.prototype });

    const result = mapToOperation(tx, testAddress);

    expect(result.value).toBe(2000000000000000000n);
  });

  it("handles null fee by defaulting to 0", () => {
    // Tests toBigInt with null input
    const tx = createTransaction({ fee: null as unknown as typeof BigNumber.prototype, fees: undefined });

    const result = mapToOperation(tx, testAddress);

    expect(result.tx.fees).toBe(0n);
  });

  it("handles missing fee and fees fields by defaulting to 0", () => {
    // Tests toBigInt with undefined input (both fee and fees missing)
    const tx = createTransaction({ fee: undefined, fees: undefined });

    const result = mapToOperation(tx, testAddress);

    expect(result.tx.fees).toBe(0n);
  });

  it("handles unknown type in value field by defaulting to 0", () => {
    // Tests toBigInt fallback branch for unknown types
    const tx = createTransaction({ 
      value: { someUnknownType: true } as unknown as typeof BigNumber.prototype 
    });

    const result = mapToOperation(tx, testAddress);

    expect(result.value).toBe(0n);
  });

  it("handles missing timestamp by defaulting to epoch", () => {
    const tx = createTransaction({ timestamp: undefined });

    const result = mapToOperation(tx, testAddress);

    expect(result.tx.date).toEqual(new Date(0));
  });

  describe("ESDT operations", () => {
    it("maps ESDT transfer with correct asset type (AC: #3)", () => {
      const tx = createTransaction({
        txHash: "esdt-hash-123",
        sender: otherAddress,
        receiver: testAddress,
        transfer: MultiversXTransferOptions.esdt,
        tokenIdentifier: "USDC-c76f1f",
        tokenValue: "1000000",
        value: new BigNumber("0"), // EGLD value is 0 for ESDT transfers
      });

      const result = mapToOperation(tx, testAddress);

      expect(result.asset.type).toBe("esdt");
      expect((result.asset as { assetReference?: string }).assetReference).toBe("USDC-c76f1f");
    });

    it("maps ESDT transfer IN operation correctly (Subtask 5.1)", () => {
      const tx = createTransaction({
        sender: otherAddress,
        receiver: testAddress,
        transfer: MultiversXTransferOptions.esdt,
        tokenIdentifier: "MEX-455c57",
        tokenValue: "5000000000000000000",
      });

      const result = mapToOperation(tx, testAddress);

      expect(result.type).toBe("IN");
      expect(result.asset.type).toBe("esdt");
      expect((result.asset as { assetReference?: string }).assetReference).toBe("MEX-455c57");
      expect(result.value).toBe(5000000000000000000n);
    });

    it("maps ESDT transfer OUT operation correctly (Subtask 5.2)", () => {
      const tx = createTransaction({
        sender: testAddress,
        receiver: otherAddress,
        transfer: MultiversXTransferOptions.esdt,
        tokenIdentifier: "WEGLD-bd4d79",
        tokenValue: "2500000000000000000",
      });

      const result = mapToOperation(tx, testAddress);

      expect(result.type).toBe("OUT");
      expect(result.asset.type).toBe("esdt");
      expect((result.asset as { assetReference?: string }).assetReference).toBe("WEGLD-bd4d79");
      expect(result.value).toBe(2500000000000000000n);
    });

    it("uses tokenValue for ESDT value instead of value field (Subtask 5.3)", () => {
      const tx = createTransaction({
        transfer: MultiversXTransferOptions.esdt,
        tokenIdentifier: "USDC-c76f1f",
        tokenValue: "1000000",
        value: new BigNumber("0"), // EGLD value should be ignored
      });

      const result = mapToOperation(tx, testAddress);

      expect(result.value).toBe(1000000n);
    });

    it("converts tokenValue string to bigint correctly (Subtask 5.4)", () => {
      const tx = createTransaction({
        transfer: MultiversXTransferOptions.esdt,
        tokenIdentifier: "UTK-2f80e9",
        tokenValue: "999999999999999999999",
      });

      const result = mapToOperation(tx, testAddress);

      expect(result.value).toBe(999999999999999999999n);
    });

    it("handles ESDT with zero value (Subtask 5.5)", () => {
      const tx = createTransaction({
        transfer: MultiversXTransferOptions.esdt,
        tokenIdentifier: "RIDE-7d18e9",
        tokenValue: "0",
      });

      const result = mapToOperation(tx, testAddress);

      expect(result.asset.type).toBe("esdt");
      expect(result.value).toBe(0n);
    });

    it("handles missing tokenValue field by defaulting to 0n (Subtask 5.6)", () => {
      const tx = createTransaction({
        transfer: MultiversXTransferOptions.esdt,
        tokenIdentifier: "LKMEX-aab910",
        tokenValue: undefined,
      });

      const result = mapToOperation(tx, testAddress);

      expect(result.asset.type).toBe("esdt");
      expect(result.value).toBe(0n);
    });

    it("handles missing tokenIdentifier by using empty string", () => {
      const tx = createTransaction({
        transfer: MultiversXTransferOptions.esdt,
        tokenIdentifier: undefined,
        tokenValue: "1000",
      });

      const result = mapToOperation(tx, testAddress);

      expect(result.asset.type).toBe("esdt");
      expect((result.asset as { assetReference?: string }).assetReference).toBe("");
    });

    it("preserves EGLD mapping logic when transfer is not esdt (Subtask 1.6)", () => {
      const tx = createTransaction({
        value: new BigNumber("1000000000000000000"),
        transfer: undefined, // No transfer field = EGLD
      });

      const result = mapToOperation(tx, testAddress);

      expect(result.asset.type).toBe("native");
      expect(result.value).toBe(1000000000000000000n);
    });

    it("preserves EGLD mapping logic when transfer is egld (Subtask 1.6)", () => {
      const tx = createTransaction({
        value: new BigNumber("2000000000000000000"),
        transfer: MultiversXTransferOptions.egld,
      });

      const result = mapToOperation(tx, testAddress);

      expect(result.asset.type).toBe("native");
      expect(result.value).toBe(2000000000000000000n);
    });
  });
});

describe("mapToStake", () => {
  const TEST_ADDRESS = "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th";
  const VALIDATOR_CONTRACT = "erd1qqqqqqqqqqqqqpgqp699jngundfqw07d8jzkepucvpzush6k3wvqyc44rx";

  const createDelegation = (
    overrides: Partial<MultiversXDelegation> = {},
  ): MultiversXDelegation => ({
    address: TEST_ADDRESS,
    contract: VALIDATOR_CONTRACT,
    userActiveStake: "1000000000000000000",
    claimableRewards: "50000000000000000",
    userUnBondable: "0",
    userUndelegatedList: [],
    ...overrides,
  });

  it("maps active delegation to Stake with 'active' state (AC: #1, Subtask 6.2)", () => {
    const delegation = createDelegation();

    const stake = mapToStake(delegation, TEST_ADDRESS);

    expect(stake.uid).toBe(`${TEST_ADDRESS}-${VALIDATOR_CONTRACT}`);
    expect(stake.address).toBe(TEST_ADDRESS);
    expect(stake.delegate).toBe(VALIDATOR_CONTRACT);
    expect(stake.state).toBe("active");
    expect(stake.asset).toEqual({ type: "native" });
    expect(stake.amountDeposited).toBe(1000000000000000000n);
    expect(stake.amountRewarded).toBe(50000000000000000n);
  });

  it("maps delegation with userUndelegatedList to 'deactivating' state (AC: #1, Subtask 6.3)", () => {
    const delegation = createDelegation({
      userActiveStake: "500000000000000000",
      claimableRewards: "0",
      userUndelegatedList: [{ amount: "500000000000000000", seconds: 86400 }],
    });

    const stake = mapToStake(delegation, TEST_ADDRESS);

    expect(stake.state).toBe("deactivating");
    // Total should include undelegating amount
    expect(stake.amount).toBe(1000000000000000000n);
  });

  it("maps delegation with no active stake to 'inactive' state (Subtask 6.4)", () => {
    const delegation = createDelegation({
      userActiveStake: "0",
      claimableRewards: "0",
      userUnBondable: "1000000000000000000",
      userUndelegatedList: [],
    });

    const stake = mapToStake(delegation, TEST_ADDRESS);

    expect(stake.state).toBe("inactive");
  });

  it("correctly calculates total amount including rewards and undelegating (Subtask 6.5)", () => {
    const delegation = createDelegation({
      userActiveStake: "1000000000000000000", // 1 EGLD
      claimableRewards: "100000000000000000", // 0.1 EGLD
      userUndelegatedList: [
        { amount: "200000000000000000", seconds: 86400 }, // 0.2 EGLD
        { amount: "300000000000000000", seconds: 172800 }, // 0.3 EGLD
      ],
    });

    const stake = mapToStake(delegation, TEST_ADDRESS);

    // Total = 1 + 0.1 + 0.2 + 0.3 = 1.6 EGLD
    expect(stake.amount).toBe(1600000000000000000n);
  });

  it("generates correct unique id format (Subtask 6.6)", () => {
    const delegation = createDelegation();

    const stake = mapToStake(delegation, TEST_ADDRESS);

    expect(stake.uid).toBe(`${TEST_ADDRESS}-${VALIDATOR_CONTRACT}`);
  });

  it("handles delegation with claimableRewards = '0' (Subtask 6.7)", () => {
    const delegation = createDelegation({
      claimableRewards: "0",
    });

    const stake = mapToStake(delegation, TEST_ADDRESS);

    expect(stake.amountRewarded).toBe(0n);
    expect(stake.amount).toBe(1000000000000000000n);
  });

  it("handles delegation with empty userUndelegatedList (Subtask 6.8)", () => {
    const delegation = createDelegation({
      userUndelegatedList: [],
    });

    const stake = mapToStake(delegation, TEST_ADDRESS);

    expect(stake.state).toBe("active");
    // Amount = activeStake + rewards (no undelegating amounts)
    expect(stake.amount).toBe(1050000000000000000n);
  });

  it("prioritizes deactivating state over active when has undelegations and active stake", () => {
    const delegation = createDelegation({
      userActiveStake: "1000000000000000000",
      userUndelegatedList: [{ amount: "500000000000000000", seconds: 86400 }],
    });

    const stake = mapToStake(delegation, TEST_ADDRESS);

    // Deactivating takes priority when has pending unbonding
    expect(stake.state).toBe("deactivating");
  });

  it("maps contract to delegate field (Subtask 1.2)", () => {
    const delegation = createDelegation({
      contract: "erd1qqqqqqqqqqqqqpgqdp68fhkp4xud02tmyk9f7g92aqdv0ga35yqs8h6ghu",
    });

    const stake = mapToStake(delegation, TEST_ADDRESS);

    expect(stake.delegate).toBe("erd1qqqqqqqqqqqqqpgqdp68fhkp4xud02tmyk9f7g92aqdv0ga35yqs8h6ghu");
  });

  it("sets asset to native type for EGLD staking (Subtask 1.7)", () => {
    const delegation = createDelegation();

    const stake = mapToStake(delegation, TEST_ADDRESS);

    expect(stake.asset).toEqual({ type: "native" });
  });

  it("includes userUnBondable (withdrawable) in total amount calculation", () => {
    const delegation = createDelegation({
      userActiveStake: "1000000000000000000", // 1 EGLD
      claimableRewards: "100000000000000000", // 0.1 EGLD
      userUnBondable: "500000000000000000", // 0.5 EGLD withdrawable
      userUndelegatedList: [],
    });

    const stake = mapToStake(delegation, TEST_ADDRESS);

    // Total = 1 + 0.1 + 0.5 = 1.6 EGLD
    expect(stake.amount).toBe(1600000000000000000n);
  });

  it("includes all components in total: stake + rewards + undelegating + withdrawable", () => {
    const delegation = createDelegation({
      userActiveStake: "1000000000000000000", // 1 EGLD
      claimableRewards: "100000000000000000", // 0.1 EGLD
      userUnBondable: "200000000000000000", // 0.2 EGLD withdrawable
      userUndelegatedList: [
        { amount: "300000000000000000", seconds: 86400 }, // 0.3 EGLD undelegating
      ],
    });

    const stake = mapToStake(delegation, TEST_ADDRESS);

    // Total = 1 + 0.1 + 0.2 + 0.3 = 1.6 EGLD
    expect(stake.amount).toBe(1600000000000000000n);
  });

  it("does not double-count withdrawable stake when both userUnBondable and completed undelegations are present", () => {
    const delegation = createDelegation({
      userActiveStake: "0",
      claimableRewards: "0",
      // Some APIs can expose both an aggregated withdrawable field and list entries with seconds === 0.
      userUnBondable: "500000000000000000", // 0.5 EGLD withdrawable
      userUndelegatedList: [
        { amount: "500000000000000000", seconds: 0 }, // same withdrawable amount
        { amount: "200000000000000000", seconds: 3600 }, // 0.2 EGLD still pending
      ],
    });

    const stake = mapToStake(delegation, TEST_ADDRESS);

    // Total = withdrawable(0.5) + pending(0.2) = 0.7 EGLD
    expect(stake.amount).toBe(700000000000000000n);
    expect(stake.state).toBe("deactivating"); // pending takes precedence
  });

  it("handles missing userUnBondable gracefully (defaults to 0)", () => {
    const delegation = {
      address: TEST_ADDRESS,
      contract: VALIDATOR_CONTRACT,
      userActiveStake: "1000000000000000000",
      claimableRewards: "0",
      userUnBondable: undefined as unknown as string, // Simulate missing field
      userUndelegatedList: [],
    };

    const stake = mapToStake(delegation, TEST_ADDRESS);

    expect(stake.amount).toBe(1000000000000000000n);
  });

  describe("state mapping with improved logic (AC: #2, #3)", () => {
    it("returns 'inactive' when undelegation has seconds === 0 (AC: #3 - withdrawable)", () => {
      const delegation = createDelegation({
        userActiveStake: "0",
        claimableRewards: "0",
        userUnBondable: "0",
        userUndelegatedList: [{ amount: "500000000000000000", seconds: 0 }], // Complete
      });

      const stake = mapToStake(delegation, TEST_ADDRESS);

      expect(stake.state).toBe("inactive");
    });

    it("returns 'deactivating' when undelegation has seconds > 0 (AC: #2 - unstaking)", () => {
      const delegation = createDelegation({
        userActiveStake: "0",
        claimableRewards: "0",
        userUnBondable: "0",
        userUndelegatedList: [{ amount: "500000000000000000", seconds: 3600 }], // Still waiting
      });

      const stake = mapToStake(delegation, TEST_ADDRESS);

      expect(stake.state).toBe("deactivating");
    });

    it("returns 'deactivating' when mixed undelegations (some pending, some complete)", () => {
      const delegation = createDelegation({
        userActiveStake: "0",
        claimableRewards: "0",
        userUnBondable: "0",
        userUndelegatedList: [
          { amount: "200000000000000000", seconds: 0 }, // Complete
          { amount: "300000000000000000", seconds: 7200 }, // Pending
        ],
      });

      const stake = mapToStake(delegation, TEST_ADDRESS);

      // Pending takes precedence
      expect(stake.state).toBe("deactivating");
    });
  });

  describe("details field (AC: #1-5 context)", () => {
    it("includes userUnBondable in details", () => {
      const delegation = createDelegation({
        userUnBondable: "500000000000000000",
      });

      const stake = mapToStake(delegation, TEST_ADDRESS);

      expect(stake.details).toBeDefined();
      expect(stake.details?.userUnBondable).toBe("500000000000000000");
    });

    it("includes userUndelegatedList in details", () => {
      const delegation = createDelegation({
        userUndelegatedList: [
          { amount: "100000000000000000", seconds: 3600 },
          { amount: "200000000000000000", seconds: 0 },
        ],
      });

      const stake = mapToStake(delegation, TEST_ADDRESS);

      expect(stake.details).toBeDefined();
      expect(stake.details?.userUndelegatedList).toEqual([
        { amount: "100000000000000000", seconds: 3600 },
        { amount: "200000000000000000", seconds: 0 },
      ]);
    });

    it("includes empty userUndelegatedList in details", () => {
      const delegation = createDelegation({
        userUndelegatedList: [],
      });

      const stake = mapToStake(delegation, TEST_ADDRESS);

      expect(stake.details?.userUndelegatedList).toEqual([]);
    });
  });
});

describe("mapToValidator", () => {
  const createProvider = (overrides: Partial<MultiversXProvider> = {}): MultiversXProvider =>
    ({
      contract: "erd1qqqqqqqqqqqqqpgqp699jngundfqw07d8jzkepucvpzush6k3wvqyc44rx",
      serviceFee: "10",
      totalActiveStake: "1000000000000000000000",
      aprValue: 8.5,
      identity: {
        key: "key123",
        name: "Ledger Staking",
        avatar: "https://example.com/logo.png",
        description: "Professional staking provider",
        twitter: "@ledger",
        url: "https://ledger.com",
      },
      ...overrides,
    }) as unknown as MultiversXProvider;

  it("maps provider with complete identity to Validator", () => {
    const provider = createProvider();

    const validator = mapToValidator(provider);

    expect(validator.address).toBe(provider.contract);
    expect(validator.name).toBe("Ledger Staking");
    expect(validator.description).toBe("Professional staking provider");
    expect(validator.url).toBe("https://ledger.com");
    expect(validator.logo).toBe("https://example.com/logo.png");
    expect(validator.balance).toBe(1000000000000000000000n);
    expect(validator.commissionRate).toBe("10");
    expect(validator.apy).toBe(0.085);
  });

  it("uses contract as name when identity.name is empty", () => {
    const provider = createProvider({
      identity: {
        key: "key123",
        name: "",
        avatar: "https://example.com/logo.png",
        description: "Professional staking provider",
        twitter: "@ledger",
        url: "https://ledger.com",
      },
    });

    const validator = mapToValidator(provider);
    expect(validator.name).toBe(provider.contract);
  });

  it("handles missing identity gracefully", () => {
    const provider = createProvider({
      identity: undefined as unknown as MultiversXProvider["identity"],
    });

    const validator = mapToValidator(provider);

    expect(validator.address).toBe(provider.contract);
    expect(validator.name).toBe(provider.contract);
    expect(validator.description).toBeUndefined();
    expect(validator.url).toBeUndefined();
    expect(validator.logo).toBeUndefined();
  });

  it("handles partial identity (some fields missing)", () => {
    const provider = createProvider({
      identity: { name: "Some validator" } as unknown as MultiversXProvider["identity"],
    });

    const validator = mapToValidator(provider);

    expect(validator.name).toBe("Some validator");
    expect(validator.description).toBeUndefined();
    expect(validator.url).toBeUndefined();
    expect(validator.logo).toBeUndefined();
  });

  it("converts APY from percentage to decimal", () => {
    const provider = createProvider({ aprValue: 12.5 });

    const validator = mapToValidator(provider);
    expect(validator.apy).toBe(0.125);
  });

  it("converts totalActiveStake to bigint balance", () => {
    const provider = createProvider({ totalActiveStake: "5000000000000000000000" });

    const validator = mapToValidator(provider);
    expect(validator.balance).toBe(5000000000000000000000n);
  });

  it("passes through commissionRate (serviceFee) unchanged", () => {
    const provider = createProvider({ serviceFee: "25" });

    const validator = mapToValidator(provider);
    expect(validator.commissionRate).toBe("25");
  });

  it("uses contract as name when identity.name is whitespace-only", () => {
    const provider = createProvider({
      identity: {
        key: "key123",
        name: "   \t\n  ",
        avatar: "https://example.com/logo.png",
        description: "Professional staking provider",
        twitter: "@ledger",
        url: "https://ledger.com",
      },
    });

    const validator = mapToValidator(provider);
    expect(validator.name).toBe(provider.contract);
  });

  it("handles aprValue of 0 correctly", () => {
    const provider = createProvider({ aprValue: 0 });

    const validator = mapToValidator(provider);
    expect(validator.apy).toBe(0);
  });

  it("handles aprValue being null gracefully", () => {
    const provider = createProvider({ aprValue: null as unknown as number });

    const validator = mapToValidator(provider);
    expect(validator.apy).toBeUndefined();
  });

  it("handles aprValue being undefined gracefully", () => {
    const provider = createProvider({ aprValue: undefined as unknown as number });

    const validator = mapToValidator(provider);
    expect(validator.apy).toBeUndefined();
  });

  it("handles aprValue being NaN gracefully", () => {
    const provider = createProvider({ aprValue: NaN });

    const validator = mapToValidator(provider);
    expect(validator.apy).toBeUndefined();
  });

  it("handles aprValue being Infinity gracefully", () => {
    const provider = createProvider({ aprValue: Infinity });

    const validator = mapToValidator(provider);
    expect(validator.apy).toBeUndefined();
  });

  it("handles aprValue being -Infinity gracefully", () => {
    const provider = createProvider({ aprValue: -Infinity });

    const validator = mapToValidator(provider);
    expect(validator.apy).toBeUndefined();
  });

  it("handles very large aprValue correctly", () => {
    const provider = createProvider({ aprValue: 999999 });

    const validator = mapToValidator(provider);
    expect(validator.apy).toBe(9999.99);
  });

  it("handles invalid totalActiveStake string gracefully", () => {
    const provider = createProvider({ totalActiveStake: "invalid-number" });

    const validator = mapToValidator(provider);
    expect(validator.balance).toBe(0n);
  });

  it("handles missing totalActiveStake gracefully", () => {
    const provider = createProvider({ totalActiveStake: undefined as unknown as string });

    const validator = mapToValidator(provider);
    expect(validator.balance).toBe(0n);
  });

  it("handles commissionRate (serviceFee) being undefined", () => {
    const provider = createProvider({ serviceFee: undefined as unknown as string });

    const validator = mapToValidator(provider);
    expect(validator.commissionRate).toBeUndefined();
  });

  it("handles commissionRate (serviceFee) being null", () => {
    const provider = createProvider({ serviceFee: null as unknown as string });

    const validator = mapToValidator(provider);
    expect(validator.commissionRate).toBeUndefined();
  });
});

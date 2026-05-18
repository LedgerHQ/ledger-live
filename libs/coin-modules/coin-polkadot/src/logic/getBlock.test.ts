import { getBlock } from "./getBlock";
import { fixtureBlockByHeight } from "../network/sidecar.fixture";

const mockGetBlockByHeight = jest.fn();

jest.mock("../network", () => {
  return {
    __esModule: true,
    default: {
      getBlockByHeight: (...args: unknown[]) => mockGetBlockByHeight(...args),
    },
  };
});

describe("getBlock", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("height validation", () => {
    it("rejects height 0", async () => {
      await expect(getBlock(0)).rejects.toThrow(
        "getBlock: height must be a positive integer, got 0",
      );
    });

    it("rejects negative height", async () => {
      await expect(getBlock(-1)).rejects.toThrow(
        "getBlock: height must be a positive integer, got -1",
      );
    });

    it("rejects non-integer height", async () => {
      await expect(getBlock(1.5)).rejects.toThrow(
        "getBlock: height must be a positive integer, got 1.5",
      );
    });

    it("rejects NaN", async () => {
      await expect(getBlock(Number.NaN)).rejects.toThrow(
        "getBlock: height must be a positive integer, got NaN",
      );
    });

    it("rejects Infinity", async () => {
      await expect(getBlock(Number.POSITIVE_INFINITY)).rejects.toThrow(
        "getBlock: height must be a positive integer, got Infinity",
      );
    });
  });

  describe("block info mapping", () => {
    it("returns correct block info with parent for height > 1", async () => {
      mockGetBlockByHeight.mockResolvedValueOnce({
        ...fixtureBlockByHeight,
        number: "100",
      });

      const result = await getBlock(100);

      expect(result.info.height).toBe(100);
      expect(result.info.hash).toBe(fixtureBlockByHeight.hash);
      expect(result.info.time).toBeInstanceOf(Date);
      expect(result.info.parent).toEqual({
        height: 99,
        hash: fixtureBlockByHeight.parentHash,
      });
    });

    it("returns block info without parent for genesis block (height === 1)", async () => {
      mockGetBlockByHeight.mockResolvedValueOnce({
        ...fixtureBlockByHeight,
        number: "1",
        extrinsics: [],
      });

      const result = await getBlock(1);

      expect(result.info.height).toBe(1);
      expect(result.info.parent).toBeUndefined();
    });
  });

  describe("transaction filtering", () => {
    it("filters out unsigned inherents (signature === null)", async () => {
      mockGetBlockByHeight.mockResolvedValueOnce({
        ...fixtureBlockByHeight,
        number: "100",
      });

      const result = await getBlock(100);

      // fixtureBlockByHeight has 2 extrinsics: 1 unsigned (timestamp.set) + 1 signed (transfer)
      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0].hash).toBe(
        "0x2222222222222222222222222222222222222222222222222222222222222222",
      );
    });

    it("returns empty transactions for blocks with only inherents", async () => {
      mockGetBlockByHeight.mockResolvedValueOnce({
        ...fixtureBlockByHeight,
        number: "100",
        extrinsics: [
          {
            method: { pallet: "timestamp", method: "set" },
            signature: null,
            nonce: null,
            args: { now: "1700000000000" },
            tip: null,
            hash: "0x1111111111111111111111111111111111111111111111111111111111111111",
            era: { immortalEra: "0x00" },
            events: [],
            success: true,
            paysFee: false,
          },
        ],
      });

      const result = await getBlock(100);
      expect(result.transactions).toHaveLength(0);
    });
  });

  describe("transfer mapping", () => {
    it("maps a successful balances.transferKeepAlive to two transfer operations", async () => {
      mockGetBlockByHeight.mockResolvedValueOnce({
        ...fixtureBlockByHeight,
        number: "100",
      });

      const result = await getBlock(100);
      const tx = result.transactions[0];

      expect(tx.hash).toBe(
        "0x2222222222222222222222222222222222222222222222222222222222222222",
      );
      expect(tx.failed).toBe(false);
      expect(tx.fees).toBe(BigInt("125000000"));
      expect(tx.feesPayer).toBe("5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY");
      expect(tx.operations).toHaveLength(2);

      // Outgoing operation (sender)
      expect(tx.operations[0]).toEqual({
        type: "transfer",
        address: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
        peer: "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
        asset: { type: "native" },
        amount: BigInt("-1000000000"),
      });

      // Incoming operation (recipient)
      expect(tx.operations[1]).toEqual({
        type: "transfer",
        address: "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
        peer: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
        asset: { type: "native" },
        amount: BigInt("1000000000"),
      });
    });

    it("returns empty operations for failed extrinsics", async () => {
      mockGetBlockByHeight.mockResolvedValueOnce({
        ...fixtureBlockByHeight,
        number: "100",
        extrinsics: [
          {
            method: { pallet: "balances", method: "transferKeepAlive" },
            signature: {
              signer: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
              signature: "0xaabb",
            },
            nonce: "42",
            args: {},
            tip: "0",
            hash: "0x3333333333333333333333333333333333333333333333333333333333333333",
            era: { immortalEra: "0x00" },
            events: [
              {
                method: { pallet: "transactionPayment", method: "TransactionFeePaid" },
                data: ["5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY", "125000000", "0"],
              },
            ],
            success: false,
            paysFee: true,
          },
        ],
      });

      const result = await getBlock(100);
      const tx = result.transactions[0];

      expect(tx.failed).toBe(true);
      expect(tx.fees).toBe(BigInt("125000000"));
      expect(tx.operations).toHaveLength(0);
    });

    it("maps non-transfer extrinsics to 'other' operation", async () => {
      mockGetBlockByHeight.mockResolvedValueOnce({
        ...fixtureBlockByHeight,
        number: "100",
        extrinsics: [
          {
            method: { pallet: "staking", method: "bond" },
            signature: {
              signer: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
              signature: "0xaabb",
            },
            nonce: "10",
            args: {},
            tip: "0",
            hash: "0x4444444444444444444444444444444444444444444444444444444444444444",
            era: { immortalEra: "0x00" },
            events: [
              {
                method: { pallet: "transactionPayment", method: "TransactionFeePaid" },
                data: ["5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY", "50000000", "0"],
              },
            ],
            success: true,
            paysFee: true,
          },
        ],
      });

      const result = await getBlock(100);
      const tx = result.transactions[0];

      expect(tx.operations).toHaveLength(1);
      expect(tx.operations[0]).toEqual({ type: "other" });
      expect(tx.fees).toBe(BigInt("50000000"));
    });
  });

  describe("fee extraction", () => {
    it("returns 0 fees when paysFee is false", async () => {
      mockGetBlockByHeight.mockResolvedValueOnce({
        ...fixtureBlockByHeight,
        number: "100",
        extrinsics: [
          {
            method: { pallet: "system", method: "remark" },
            signature: {
              signer: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
              signature: "0xaabb",
            },
            nonce: "1",
            args: {},
            tip: "0",
            hash: "0x5555555555555555555555555555555555555555555555555555555555555555",
            era: { immortalEra: "0x00" },
            events: [],
            success: true,
            paysFee: false,
          },
        ],
      });

      const result = await getBlock(100);
      expect(result.transactions[0].fees).toBe(BigInt(0));
    });

    it("returns 0 fees when TransactionFeePaid event is absent", async () => {
      mockGetBlockByHeight.mockResolvedValueOnce({
        ...fixtureBlockByHeight,
        number: "100",
        extrinsics: [
          {
            method: { pallet: "staking", method: "nominate" },
            signature: {
              signer: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
              signature: "0xaabb",
            },
            nonce: "1",
            args: {},
            tip: "0",
            hash: "0x6666666666666666666666666666666666666666666666666666666666666666",
            era: { immortalEra: "0x00" },
            events: [],
            success: true,
            paysFee: true,
          },
        ],
      });

      const result = await getBlock(100);
      expect(result.transactions[0].fees).toBe(BigInt(0));
    });
  });
});

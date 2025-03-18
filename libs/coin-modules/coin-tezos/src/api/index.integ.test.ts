import { IncorrectTypeError, type Api } from "@ledgerhq/coin-framework/api/index";
import { createApi } from ".";
/**
 * https://teztnets.com/ghostnet-about
 * https://api.tzkt.io/#section/Get-Started/Free-TzKT-API
 */
describe("Tezos Api", () => {
  let module: Api<void>;
  const address = "tz1heMGVHQnx7ALDcDKqez8fan64Eyicw4DJ";

  beforeAll(() => {
    module = createApi({
      baker: {
        url: "https://baker.example.com",
      },
      explorer: {
        url: "https://api.ghostnet.tzkt.io",
        maxTxQuery: 100,
      },
      node: {
        url: "https://rpc.ghostnet.teztnets.com",
      },
      fees: {
        minGasLimit: 600,
        minRevealGasLimit: 300,
        minStorageLimit: 0,
        minFees: 500,
        minEstimatedFees: 500,
      },
    });
  });

  describe("estimateFees", () => {
    it("returns a default value", async () => {
      // Given
      const amount = BigInt(100);

      // When
      const result = await module.estimateFees({
        type: "send",
        sender: address,
        recipient: "tz1heMGVHQnx7ALDcDKqez8fan64Eyicw4DJ",
        amount,
      });

      // Then
      expect(result).toBeGreaterThanOrEqual(BigInt(0));
    });
  });

  describe.only("listOperations", () => {
    it("returns a list regarding address parameter", async () => {
      // When
      const [tx, _] = await module.listOperations(address, { minHeight: 0 });

      // Then
      expect(tx.length).toBeGreaterThanOrEqual(1);
      tx.forEach(operation => {
        const isSenderOrReceipt =
          operation.senders.includes(address) || operation.recipients.includes(address);
        expect(isSenderOrReceipt).toBeTruthy();
        expect(operation.tx.block).toBeDefined();
      });
    });

    it("returns all operations", async () => {
      // When
      const [tx, _] = await module.listOperations(address, { minHeight: 0 });

      // Then
      // Find a way to create a unique id. In Tezos, the same hash may represent different operations in case of delegation.
      const checkSet = new Set(tx.map(elt => `${elt.tx.hash}${elt.type}${elt.senders[0]}`));
      expect(checkSet.size).toEqual(tx.length);
    });
  });

  describe("lastBlock", () => {
    it("returns last block info", async () => {
      // When
      const result = await module.lastBlock();

      // Then
      expect(result.hash).toBeDefined();
      expect(result.height).toBeDefined();
      expect(result.time).toBeInstanceOf(Date);
    });
  });

  describe("getBalance", () => {
    it("returns a list regarding address parameter", async () => {
      // When
      const result = await module.getBalance(address);

      // Then
      expect(result).toBeGreaterThan(0);
    });
  });

  describe("craftTransaction", () => {
    it.each([
      {
        type: "send",
        rawTx:
          "6c0053ddb3b3a89ed5c8d8326066032beac6de225c9e010300000a0000a31e81ac3425310e3274a4698a793b2839dc0afa00",
      },
      {
        type: "delegate",
        rawTx:
          "6e0053ddb3b3a89ed5c8d8326066032beac6de225c9e01030000ff00a31e81ac3425310e3274a4698a793b2839dc0afa",
      },
      {
        type: "undelegate",
        rawTx: "6e0053ddb3b3a89ed5c8d8326066032beac6de225c9e0103000000",
      },
    ])("returns a raw transaction with $type", async ({ type, rawTx }) => {
      // When
      const result = await module.craftTransaction(address, {
        type,
        recipient: "tz1aWXP237BLwNHJcCD4b3DutCevhqq2T1Z9",
        amount: BigInt(10),
        fee: BigInt(1),
      });

      // Then
      expect(result.slice(64)).toEqual(rawTx);
    });

    it("throws an error if type in 'send' or 'delegate' or 'undelegate'", async () => {
      // When
      await expect(
        module.craftTransaction(address, {
          type: "WHATEVERTYPE",
          recipient: "tz1aWXP237BLwNHJcCD4b3DutCevhqq2T1Z9",
          amount: BigInt(10),
          fee: BigInt(1),
        }),
      ).rejects.toThrow(IncorrectTypeError);
    });
  });
});

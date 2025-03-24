import { type Api } from "@ledgerhq/coin-framework/api/index";
import { createApi } from ".";
import * as CraftingFunctions from "../logic/craftTransaction";
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

  describe("listOperations", () => {
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
          "6c00f16245ed1f661b092e590028e6ad69fdb2b3d91fa002d31d00000a0000a31e81ac3425310e3274a4698a793b2839dc0afa00",
      },
      {
        type: "delegate",
        rawTx:
          "6e00f16245ed1f661b092e590028e6ad69fdb2b3d91fa002d31d0000ff00a31e81ac3425310e3274a4698a793b2839dc0afa",
      },
      {
        type: "undelegate",
        rawTx: "6e00f16245ed1f661b092e590028e6ad69fdb2b3d91fa002d31d000000",
      },
    ])("returns a raw transaction with $type", async ({ type, rawTx }) => {
      // When
      const result = await module.craftTransaction({
        type,
        sender: address,
        recipient: "tz1aWXP237BLwNHJcCD4b3DutCevhqq2T1Z9",
        amount: BigInt(10),
      });

      // Then
      expect(result.slice(64)).toEqual(rawTx);
    });

    it("should create a transaction with an estimated fees when user does not provide them", async () => {
      const spy = jest.spyOn(CraftingFunctions, "craftTransaction");
      await module.craftTransaction({
        type: "send",
        sender: address,
        recipient: "tz1aWXP237BLwNHJcCD4b3DutCevhqq2T1Z9",
        amount: BigInt(10),
      });

      expect(spy).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ fee: { fees: "288" } }),
      );
    });

    it.each([1n, 50n, 99n])(
      "should create a transaction with the user fees when user provide them",
      async (feesLimit: bigint) => {
        const spy = jest.spyOn(CraftingFunctions, "craftTransaction");
        await module.craftTransaction(
          {
            type: "send",
            sender: address,
            recipient: "tz1aWXP237BLwNHJcCD4b3DutCevhqq2T1Z9",
            amount: BigInt(10),
          },
          feesLimit,
        );

        expect(spy).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({ fee: { fees: feesLimit.toString() } }),
        );
      },
    );
  });
});

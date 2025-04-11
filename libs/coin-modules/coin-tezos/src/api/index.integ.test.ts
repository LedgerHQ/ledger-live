import { type Api } from "@ledgerhq/coin-framework/api/index";
import { localForger } from "@taquito/local-forging";
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
    async function decode(sbytes: string) {
      return await localForger.parse(sbytes);
    }

    it.each(["send", "delegate", "undelegate"])("returns a raw transaction with %s", async type => {
      const recipient = "tz1aWXP237BLwNHJcCD4b3DutCevhqq2T1Z9";
      const amount = BigInt(10);
      // When
      const encodedTransaction = await module.craftTransaction({
        type,
        sender: address,
        recipient: recipient,
        amount: amount,
      });

      const decodedTransaction = await decode(encodedTransaction);
      expect(decodedTransaction.contents).toHaveLength(1);

      const operationContent = decodedTransaction.contents[0];
      expect(operationContent.source).toEqual(address);
      expect(BigInt(operationContent.fee)).toBeGreaterThan(0);

      if (type === "send") {
        expect(BigInt(operationContent.amount)).toEqual(amount);
        expect(operationContent.destination).toEqual(recipient);
      } else if (type === "delegate") {
        expect(operationContent.delegate).toEqual(recipient);
      }
    });

    it("should use estimated fees when user does not provide them for crafting a transaction", async () => {
      const encodedTransaction = await module.craftTransaction({
        type: "send",
        sender: address,
        recipient: "tz1aWXP237BLwNHJcCD4b3DutCevhqq2T1Z9",
        amount: BigInt(10),
      });

      const decodedTransaction = await decode(encodedTransaction);
      const transactionFee = BigInt(decodedTransaction.contents[0].fee);
      expect(transactionFee).toBeGreaterThan(0);
    });

    it.each([1n, 50n, 99n])(
      "should use custom user fees when user provides it for crafting a transaction",
      async (customFees: bigint) => {
        const encodedTransaction = await module.craftTransaction(
          {
            type: "send",
            sender: address,
            recipient: "tz1aWXP237BLwNHJcCD4b3DutCevhqq2T1Z9",
            amount: BigInt(10),
          },
          customFees,
        );

        const decodedTransaction = await decode(encodedTransaction);
        expect(decodedTransaction.contents[0].fee).toEqual(customFees.toString());
      },
    );
  });
});

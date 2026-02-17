import { SendTransactionIntent } from "@ledgerhq/coin-framework/api/types";
import { localForger } from "@taquito/local-forging";
import type { TezosConfig } from "../config";
import type { TezosApi } from "./types";
import { createApi } from ".";

const defaultConfig: TezosConfig = {
  baker: { url: "https://baker.example.com" },
  explorer: { url: "https://api.ghostnet.tzkt.io", maxTxQuery: 100 },
  node: { url: "https://rpc.ghostnet.teztnets.com" },
  fees: {
    minGasLimit: 600,
    minRevealGasLimit: 300,
    minStorageLimit: 0,
    minFees: 500,
    minEstimatedFees: 500,
  },
};

/**
 * Ghostnet-specific integration tests
 * https://teztnets.com/ghostnet-about
 * https://api.tzkt.io/#section/Get-Started/Free-TzKT-API
 */
describe("Tezos Api", () => {
  let module: TezosApi;
  const address = "tz1heMGVHQnx7ALDcDKqez8fan64Eyicw4DJ";

  beforeAll(() => {
    module = createApi(defaultConfig);
  });

  describe("estimateFees", () => {
    it("returns a default value", async () => {
      // Given
      const amount = BigInt(100);

      // When
      const result = await module.estimateFees({
        intentType: "transaction",
        asset: { type: "native" },
        type: "send",
        sender: address,
        recipient: "tz1heMGVHQnx7ALDcDKqez8fan64Eyicw4DJ",
        amount,
      });

      // Then
      expect(result.value).toBeGreaterThanOrEqual(BigInt(0));
      expect(result.parameters?.gasLimit).toBeGreaterThanOrEqual(BigInt(0));
      expect(result.parameters?.storageLimit).toBeGreaterThanOrEqual(BigInt(0));
    });
  });

  it.each([
    [
      "ed25519 / tz1",
      "tz1heMGVHQnx7ALDcDKqez8fan64Eyicw4DJ",
      "6D9733FB7E27C56F032FAD41E4C0C90D58D0D5F1A253B2430B702071B57E47C1",
    ],
    [
      "secp256k1 / tz2",
      "tz2DvEBHrtFkq9pTXqt6yavnf4sPe2jut2XH",
      "032fede4de54cf92381832a053f0787125fdc0d065d231585eb34d5eae327c0222",
    ],
    [
      "P256 / tz3",
      "tz3DvEBHrtFkq9pTXqt6yavnf4sPe2jut2XH",
      "0466839a78481025e3613f65fcd4b492a492bedd1a3cba77ae48eaa1803611d8e5f4e23c0d0f3586e2095f4f83d09c841e1c17586b2356d5d3a3ed3f45bb3a857e",
    ],
  ])("does not fail when providing a %s address with pub key", async (_, sender, pubKey) => {
    // When
    const result = await module.estimateFees({
      intentType: "transaction",
      asset: { type: "native" },
      type: "send",
      sender: "tz3DvEBHrtFkq9pTXqt6yavnf4sPe2jut2XH",
      senderPublicKey: pubKey,
      recipient: sender,
      amount: BigInt(100),
    } as SendTransactionIntent);

    // Then
    expect(result.value).toBeGreaterThanOrEqual(BigInt(0));
    expect(result.parameters?.gasLimit).toBeGreaterThanOrEqual(BigInt(0));
    expect(result.parameters?.storageLimit).toBeGreaterThanOrEqual(BigInt(0));
  });

  it("fails when using an unsupported address type", async () => {
    await expect(
      module.estimateFees({
        intentType: "transaction",
        asset: { type: "native" },
        type: "send",
        sender: address,
        recipient: "tz5heMGVHQnx7ALDcDKqez8fan64Eyicw4DJ",
        amount: BigInt(100),
      }),
    ).rejects.toThrow('Invalid address "tz5heMGVHQnx7ALDcDKqez8fan64Eyicw4DJ"');
  });

  describe("listOperations", () => {
    it("returns a list regarding address parameter", async () => {
      // When
      const [tx, _] = await module.listOperations(address, { minHeight: 0, order: "asc" });

      // Then
      expect(tx.length).toBeGreaterThanOrEqual(1);
      tx.forEach(operation => {
        const isSenderOrReceipt =
          operation.senders.includes(address) || operation.recipients.includes(address);
        expect(isSenderOrReceipt).toBe(true);
        expect(operation.value).toBeGreaterThanOrEqual(0);
        expect(operation.tx.hash).toMatch(/^o[1-9A-HJ-NP-Za-km-z]+/); // "o" + base58
        expect(operation.tx.block.hash).toMatch(/^B[1-9A-HJ-NP-Za-km-z]+/); // "B" + base58
        expect(operation.tx.block.height).toBeGreaterThanOrEqual(0);
        expect(operation.tx.fees).toBeGreaterThan(0);
        expect(operation.tx.date).toBeInstanceOf(Date);
      });
    });

    it("returns all operations", async () => {
      // When
      const [tx, _] = await module.listOperations(address, { minHeight: 0, order: "asc" });

      // Then
      // Find a way to create a unique id. In Tezos, the same hash may represent different operations in case of delegation.
      const checkSet = new Set(tx.map(elt => `${elt.tx.hash}${elt.type}${elt.senders[0]}`));
      expect(checkSet.size).toEqual(tx.length);
    });

    it("returns operations from latest, but in asc order", async () => {
      // When
      const [txDesc] = await module.listOperations(address, { minHeight: 0, order: "desc" });

      // Then
      // Check if the result is sorted in ascending order
      expect(txDesc[0].tx.block.height).toBeGreaterThanOrEqual(
        txDesc[txDesc.length - 1].tx.block.height,
      );
    });
  });

  describe("lastBlock", () => {
    it("returns last block info", async () => {
      // When
      const result = await module.lastBlock();

      // Then
      expect(result.hash).toMatch(/^B[1-9A-HJ-NP-Za-km-z]+/); // "B" + base58
      expect(result.height).toBeGreaterThan(0);
      expect(result.time).toBeInstanceOf(Date);
    });
  });

  describe("getBalance", () => {
    it("returns a list regarding address parameter", async () => {
      // When
      const result = await module.getBalance(address);

      // Then
      expect(result[0].asset).toEqual({ type: "native" });
      expect(result[0].value).toBeGreaterThan(0);
    });

    it("returns 0 when address is not found", async () => {
      const result = await module.getBalance("tz1euQVEofitwkUzMRKCuBK9D1ZPiy4udXz1");

      expect(result).toEqual([{ value: BigInt(0), asset: { type: "native" } }]);
    });
  });

  describe("craftTransaction", () => {
    async function decode(sbytes: string) {
      // note: strip the conventional prefix (aka watermark) added by rawEncode
      // output of craftTransaction is "payload to sign = prefix + actual raw transaction"
      return await localForger.parse(sbytes.slice(2));
    }

    it.each(["send", "delegate", "undelegate"])("returns a raw transaction with %s", async type => {
      const recipient = "tz1aWXP237BLwNHJcCD4b3DutCevhqq2T1Z9";
      const amount = BigInt(10);
      // When
      const { transaction: encodedTransaction } = await module.craftTransaction({
        intentType: "transaction",
        asset: { type: "native" },
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
      const { transaction: encodedTransaction } = await module.craftTransaction({
        intentType: "transaction",
        asset: { type: "native" },
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
        const { transaction: encodedTransaction } = await module.craftTransaction(
          {
            intentType: "transaction",
            asset: { type: "native" },
            type: "send",
            sender: address,
            recipient: "tz1aWXP237BLwNHJcCD4b3DutCevhqq2T1Z9",
            amount: BigInt(10),
          },
          { value: customFees },
        );

        const decodedTransaction = await decode(encodedTransaction);
        expect(decodedTransaction.contents[0].fee).toEqual(customFees.toString());
      },
    );
  });

  describe("with custom fees settings", () => {
    let moduleCustomFees: TezosApi;
    const minFees = 600;
    const minEstimatedFees = 550;

    beforeAll(() => {
      moduleCustomFees = createApi({
        ...defaultConfig,
        fees: {
          minGasLimit: 600,
          minRevealGasLimit: 300,
          minStorageLimit: 0,
          minFees,
          minEstimatedFees,
        },
      });
    });

    describe("estimateFees", () => {
      it("estimate fees when default estimation is greater than minFees", async () => {
        const result = await moduleCustomFees.estimateFees({
          intentType: "transaction",
          asset: { type: "native" },
          type: "send",
          sender: address,
          recipient: "tz1heMGVHQnx7ALDcDKqez8fan64Eyicw4DJ",
          amount: BigInt(100),
        });
        expect(result.value).toBeGreaterThanOrEqual(BigInt(minFees));
        expect(result.parameters?.gasLimit).toBeGreaterThanOrEqual(BigInt(0));
        expect(result.parameters?.storageLimit).toBeGreaterThanOrEqual(BigInt(0));
      });

      it("estimate fees when default estimation is lesser than minFees", async () => {
        const result = await moduleCustomFees.estimateFees({
          intentType: "transaction",
          asset: { type: "native" },
          type: "delegate",
          sender: address,
          recipient: "tz1aWXP237BLwNHJcCD4b3DutCevhqq2T1Z9",
          amount: BigInt(0),
        });
        expect(result.value).toBeGreaterThanOrEqual(BigInt(minFees));
      });
    });

    describe("craftTransaction", () => {
      it("craft transaction when default estimation is greater than minFees", async () => {
        const { transaction: encodedTransaction } = await moduleCustomFees.craftTransaction({
          intentType: "transaction",
          asset: { type: "native" },
          type: "send",
          sender: address,
          recipient: "tz1aWXP237BLwNHJcCD4b3DutCevhqq2T1Z9",
          amount: BigInt(10),
        });
        const decoded = await localForger.parse(encodedTransaction.slice(2));
        const fee = BigInt(decoded.contents[0].fee ?? "0");
        expect(fee).toBeGreaterThanOrEqual(BigInt(minFees));
      });

      it("craft transaction when default estimation is lesser than minFees", async () => {
        const { transaction: encodedTransaction } = await moduleCustomFees.craftTransaction({
          intentType: "transaction",
          asset: { type: "native" },
          type: "delegate",
          sender: address,
          recipient: "tz1aWXP237BLwNHJcCD4b3DutCevhqq2T1Z9",
          amount: BigInt(0),
        });
        const decoded = await localForger.parse(encodedTransaction.slice(2));
        const fee = BigInt(decoded.contents[0].fee ?? "0");
        expect(fee).toBeGreaterThanOrEqual(BigInt(minFees));
      });

      it("craft transaction with customFee when default estimation is greater than customFee", async () => {
        const customFee = BigInt(minFees - 50);
        const { transaction: encodedTransaction } = await moduleCustomFees.craftTransaction(
          {
            intentType: "transaction",
            asset: { type: "native" },
            type: "send",
            sender: address,
            recipient: "tz1aWXP237BLwNHJcCD4b3DutCevhqq2T1Z9",
            amount: BigInt(10),
          },
          { value: customFee },
        );
        const decoded = await localForger.parse(encodedTransaction.slice(2));
        expect(decoded.contents[0].fee).toBe(customFee.toString());
      });

      it("craft transaction with customFee when default estimation is lesser than customFee", async () => {
        const customFee = BigInt(minFees * 2);
        const { transaction: encodedTransaction } = await moduleCustomFees.craftTransaction(
          {
            intentType: "transaction",
            asset: { type: "native" },
            type: "send",
            sender: address,
            recipient: "tz1aWXP237BLwNHJcCD4b3DutCevhqq2T1Z9",
            amount: BigInt(10),
          },
          { value: customFee },
        );
        const decoded = await localForger.parse(encodedTransaction.slice(2));
        expect(decoded.contents[0].fee).toBe(customFee.toString());
      });
    });
  });
});

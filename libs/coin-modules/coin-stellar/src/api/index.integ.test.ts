import type { AlpacaApi, Operation } from "@ledgerhq/coin-framework/api/index";
import { xdr } from "@stellar/stellar-sdk";
import { createApi, envelopeFromAnyXDR } from ".";
import { StellarMemo } from "../types";

const MAGNITUDE = 10 ** 7;

describe("Stellar Api", () => {
  let module: AlpacaApi<StellarMemo>;
  const MAINNET_ADDRESS = "GA2S6CABCO4OBFX7PQSK6WQ3ZSX3WYF52TVBXQFLJAEPKKRFUXVFJUSD";

  beforeAll(() => {
    module = createApi({
      explorer: {
        url: "https://stellar.coin.ledger.com/",
      },
    });
  });

  describe("estimateFees", () => {
    it("returns a default value", async () => {
      // Given
      const amount = BigInt(100_000);

      // When
      const result = await module.estimateFees({
        asset: { type: "native" },
        type: "send",
        sender: MAINNET_ADDRESS,
        recipient: "address",
        amount: amount,
        memo: { type: "NO_MEMO" },
      });

      // Then
      expect(result.value).toEqual(BigInt(100));
    });
  });

  describe("listOperations", () => {
    let txs: Operation[];

    beforeAll(async () => {
      [txs] = await module.listOperations(MAINNET_ADDRESS, { minHeight: 0 });
    });

    it("returns a list regarding address parameter", async () => {
      expect(txs.length).toBeGreaterThanOrEqual(100);
      txs.forEach(operation => {
        const isSenderOrReceipt =
          operation.senders.includes(MAINNET_ADDRESS) ||
          operation.recipients.includes(MAINNET_ADDRESS);
        expect(isSenderOrReceipt).toBeTruthy();
      });
    });

    it("returns all operations", async () => {
      expect(txs.length).toBeGreaterThanOrEqual(100);
      const checkSet = new Set(txs.map(elt => elt.tx.hash));
      expect(checkSet.size).toEqual(txs.length);
    });

    it("adapts a XLM OUT operation", () => {
      // 0.01 XLM from MAINNET_ADDRESS to GAW5DM37KLJR3EHLWZQ4M52I5EQH6E6C6SEYMF4RPCIGNVDIIQE6EFPU
      // https://stellar.expert/explorer/public/tx/c7b84bf6297e01ce1223fabda976697c1d0ceb46fbd758d30db0d2610f791440
      const operation = txs.find(
        op => op.tx.hash === "c7b84bf6297e01ce1223fabda976697c1d0ceb46fbd758d30db0d2610f791440",
      );
      expect(operation).toBeDefined();
      expect(operation?.senders.includes(MAINNET_ADDRESS)).toEqual(true);
      expect(
        operation?.recipients.includes("GAW5DM37KLJR3EHLWZQ4M52I5EQH6E6C6SEYMF4RPCIGNVDIIQE6EFPU"),
      ).toEqual(true);
      expect(operation?.value).toEqual(BigInt(0.01 * MAGNITUDE)); // 0.01 XLM
      expect(operation?.asset.type).toEqual("native");
    });

    it("adapts a XLM IN operation", () => {
      // 30.85 XLM from GCMUIH5THNEHBN6D26HVBCDWGYSX3D42D2CCTERNJLMRFFR2YI7H3IXJ to MAINNET_ADDRESS
      // https://stellar.expert/explorer/public/tx/df888c19ad624a694e3fd2a8db923b826fd9d7157158d80e2221cc2d78a5ffb8
      const operation = txs.find(
        op => op.tx.hash === "df888c19ad624a694e3fd2a8db923b826fd9d7157158d80e2221cc2d78a5ffb8",
      );
      expect(operation).toBeDefined();
      expect(
        operation?.senders.includes("GCMUIH5THNEHBN6D26HVBCDWGYSX3D42D2CCTERNJLMRFFR2YI7H3IXJ"),
      ).toEqual(true);
      expect(operation?.recipients.includes(MAINNET_ADDRESS)).toEqual(true);
      expect(operation?.value).toEqual(BigInt(30.85 * MAGNITUDE)); // 30.85 XLM
      expect(operation?.asset.type).toEqual("native");
    });

    it("adapts a token IN operation (usdc)", () => {
      // 0.01 usdc from GAW5DM37KLJR3EHLWZQ4M52I5EQH6E6C6SEYMF4RPCIGNVDIIQE6EFPU to MAINNET_ADDRESS
      // https://stellar.expert/explorer/public/tx/c8cdcc0eae085fbb538bb460b56c980d912db0db9046aaca51ce297ce294eee0
      const operation = txs.find(
        op => op.tx.hash === "c8cdcc0eae085fbb538bb460b56c980d912db0db9046aaca51ce297ce294eee0",
      );
      expect(operation).toBeDefined();
      expect(
        operation?.senders.includes("GAW5DM37KLJR3EHLWZQ4M52I5EQH6E6C6SEYMF4RPCIGNVDIIQE6EFPU"),
      ).toEqual(true);
      expect(operation?.recipients.includes(MAINNET_ADDRESS)).toEqual(true);
      expect(operation?.value).toEqual(BigInt(0.01 * MAGNITUDE)); // 0.01 USDC
      expect(operation?.asset.type).toEqual("token");
      expect(operation?.asset.assetReference).toEqual("USDC");
      expect(operation?.asset.assetOwner).toEqual(
        "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
      );
    });

    it("adapts a token OUT operation (usdc)", () => {
      // 0.002 USDC from MAINNET_ADDRESS to GC5WDONUHHPORN5KVAG53T3QNSVMJAMQ7BVZ5OJCNH435SYZBFARNGIL
      // https://stellar.expert/explorer/public/tx/9e591b320362008b99fc73ee749700cdc01ce140e37f89b72b10801f7301c11d
      const operation = txs.find(
        op => op.tx.hash === "9e591b320362008b99fc73ee749700cdc01ce140e37f89b72b10801f7301c11d",
      );
      expect(operation).toBeDefined();
      expect(operation?.senders.includes(MAINNET_ADDRESS)).toEqual(true);
      expect(
        operation?.recipients.includes("GC5WDONUHHPORN5KVAG53T3QNSVMJAMQ7BVZ5OJCNH435SYZBFARNGIL"),
      ).toEqual(true);
      expect(operation?.value).toEqual(BigInt(0.01 * MAGNITUDE)); // 0.01 USDC
      expect(operation?.asset.type).toEqual("token");
      expect(operation?.asset.assetReference).toEqual("USDC");
      expect(operation?.asset.assetOwner).toEqual(
        "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
      );
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
      const result = await module.getBalance(MAINNET_ADDRESS);

      // Then
      expect(result.find(b => b.asset.type === "native")?.value).toBeGreaterThanOrEqual(BigInt(0));
    });
  });

  describe("craftTransaction", () => {
    const TYPE = "send";
    const RECIPIENT = "GD6QELUZPSKPRWVXOQ3F6GBF4OBRMCHO5PHREXH4ZRTPJAG7V5MD7JGX";
    const AMOUNT = BigInt(1_000_000);

    function readFees(transactionXdr: string) {
      const transactionEnvelope = envelopeFromAnyXDR(transactionXdr, "base64");
      return transactionEnvelope.value().tx().fee();
    }

    function readMemo(transactionXdr: string) {
      const transactionEnvelope = envelopeFromAnyXDR(transactionXdr, "base64");
      return (transactionEnvelope.value().tx() as xdr.TransactionV0).memo();
    }

    it("returns a raw transaction", async () => {
      const result = await module.craftTransaction({
        asset: { type: "native" },
        type: TYPE,
        sender: MAINNET_ADDRESS,
        recipient: RECIPIENT,
        amount: AMOUNT,
        memo: { type: "NO_MEMO" },
      });

      const envelope = envelopeFromAnyXDR(result, "base64");

      expect(envelope.toXDR("base64").length).toEqual(188);
    });

    it("should use estimated fees when user does not provide them for crafting a transaction", async () => {
      const transactionXdr = await module.craftTransaction({
        asset: { type: "native" },
        type: TYPE,
        sender: MAINNET_ADDRESS,
        recipient: RECIPIENT,
        amount: AMOUNT,
        memo: { type: "NO_MEMO" },
      });

      const fees = readFees(transactionXdr);
      expect(fees).toBeGreaterThan(0);
    });

    it("should use custom user fees when user provides it for crafting a transaction", async () => {
      const customFees = 99n;
      const transactionXdr = await module.craftTransaction(
        {
          asset: { type: "native" },
          type: TYPE,
          sender: MAINNET_ADDRESS,
          recipient: RECIPIENT,
          amount: AMOUNT,
          memo: { type: "NO_MEMO" },
        },
        { value: customFees },
      );

      const fees = readFees(transactionXdr);
      expect(fees).toEqual(Number(customFees));
    });

    it("should have no memo when not provided by user", async () => {
      const transactionXdr = await module.craftTransaction({
        asset: { type: "native" },
        type: TYPE,
        sender: MAINNET_ADDRESS,
        recipient: RECIPIENT,
        amount: AMOUNT,
        memo: { type: "NO_MEMO" },
      });
      expect(readMemo(transactionXdr)).toEqual(xdr.Memo.memoNone());
    });

    it("should have a memo when provided by user", async () => {
      const transactionXdr = await module.craftTransaction({
        asset: { type: "native" },
        type: TYPE,
        sender: MAINNET_ADDRESS,
        recipient: RECIPIENT,
        amount: AMOUNT,
        memo: {
          type: "MEMO_TEXT",
          value: "test",
        },
      });
      expect(readMemo(transactionXdr)).toEqual(xdr.Memo.memoText(Buffer.from("test", "ascii")));
    });
  });
});

/**
 * Testnet scan: https://testnet.lumenscan.io/
 *
 * Tests are skipped for the moment due to TooManyRequest errors
 */
describe.skip("Stellar Api (testnet)", () => {
  let module: AlpacaApi<StellarMemo>;
  const ADDRESS = "GBAUZBDXMVV7HII4JWBGFMLVKVJ6OLQAKOCGXM5E2FM4TAZB6C7JO2L7";

  beforeAll(() => {
    module = createApi({
      explorer: {
        url: "https://horizon-testnet.stellar.org/",
      },
    });
  });

  describe("estimateFees", () => {
    it("returns a default value", async () => {
      // Given
      const amount = BigInt(100_000);

      // When
      const result = await module.estimateFees({
        asset: { type: "native" },
        type: "send",
        sender: ADDRESS,
        recipient: "address",
        amount: amount,
        memo: { type: "NO_MEMO" },
      });

      // Then
      expect(result).toEqual(BigInt(100));
    });
  });

  describe("listOperations", () => {
    let txs: Operation[];

    beforeAll(async () => {
      [txs] = await module.listOperations(ADDRESS, { minHeight: 0 });
    });

    it("returns a list regarding address parameter", async () => {
      expect(txs.length).toBeGreaterThanOrEqual(100);
      txs.forEach(operation => {
        const isSenderOrReceipt =
          operation.senders.includes(ADDRESS) || operation.recipients.includes(ADDRESS);
        expect(isSenderOrReceipt).toBeTruthy();
      });
    });

    it("returns all operations", async () => {
      expect(txs.length).toBeGreaterThanOrEqual(100);
      const checkSet = new Set(txs.map(elt => elt.tx.hash));
      expect(checkSet.size).toEqual(txs.length);
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
      const result = await module.getBalance(ADDRESS);

      // Then
      expect(result).toBeGreaterThan(0);
    });
  });

  describe("craftTransaction", () => {
    const TYPE = "send";
    const RECIPIENT = "GD6QELUZPSKPRWVXOQ3F6GBF4OBRMCHO5PHREXH4ZRTPJAG7V5MD7JGX";
    const AMOUNT = BigInt(1_000_000);

    function readFees(transactionXdr: string) {
      const transactionEnvelope = envelopeFromAnyXDR(transactionXdr, "base64");
      return transactionEnvelope.value().tx().fee();
    }

    function readMemo(transactionXdr: string) {
      const transactionEnvelope = envelopeFromAnyXDR(transactionXdr, "base64");
      return (transactionEnvelope.value().tx() as xdr.TransactionV0).memo();
    }

    it("returns a raw transaction", async () => {
      const result = await module.craftTransaction({
        asset: { type: "native" },
        type: TYPE,
        sender: ADDRESS,
        recipient: RECIPIENT,
        amount: AMOUNT,
        memo: { type: "NO_MEMO" },
      });

      const envelope = envelopeFromAnyXDR(result, "base64");

      expect(envelope.toXDR("base64").length).toEqual(188);
    });

    it("should use estimated fees when user does not provide them for crafting a transaction", async () => {
      const transactionXdr = await module.craftTransaction({
        asset: { type: "native" },
        type: TYPE,
        sender: ADDRESS,
        recipient: RECIPIENT,
        amount: AMOUNT,
        memo: { type: "NO_MEMO" },
      });

      const fees = readFees(transactionXdr);
      expect(fees).toBeGreaterThan(0);
    });

    it("should use custom user fees when user provides it for crafting a transaction", async () => {
      const customFees = 99n;
      const transactionXdr = await module.craftTransaction(
        {
          asset: { type: "native" },
          type: TYPE,
          sender: ADDRESS,
          recipient: RECIPIENT,
          amount: AMOUNT,
          memo: { type: "NO_MEMO" },
        },
        { value: customFees },
      );

      const fees = readFees(transactionXdr);
      expect(fees).toEqual(Number(customFees));
    });

    it("should have no memo when not provided by user", async () => {
      const transactionXdr = await module.craftTransaction({
        asset: { type: "native" },
        type: TYPE,
        sender: ADDRESS,
        recipient: RECIPIENT,
        amount: AMOUNT,
        memo: { type: "NO_MEMO" },
      });
      expect(readMemo(transactionXdr)).toEqual(xdr.Memo.memoNone());
    });

    it("should have a memo when provided by user", async () => {
      const transactionXdr = await module.craftTransaction({
        asset: { type: "native" },
        type: TYPE,
        sender: ADDRESS,
        recipient: RECIPIENT,
        amount: AMOUNT,
        memo: {
          type: "MEMO_TEXT",
          value: "test",
        },
      });
      expect(readMemo(transactionXdr)).toEqual(xdr.Memo.memoText(Buffer.from("test", "ascii")));
    });
  });
});

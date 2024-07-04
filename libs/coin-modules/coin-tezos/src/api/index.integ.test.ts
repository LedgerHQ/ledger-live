import type { Api } from "@ledgerhq/coin-framework/api/index";
import { createApi } from ".";
/**
 * https://teztnets.com/ghostnet-about
 * https://api.tzkt.io/#section/Get-Started/Free-TzKT-API
 */
describe("Tezos Api", () => {
  let module: Api;
  const address = "tz1THUNARo58aD5YdNGYPnWNnvd8yHPrMdsF";

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
    });
  });

  describe("estimateFees", () => {
    it("returns a default value", async () => {
      // Given
      const amount = BigInt(100);

      // When
      const result = await module.estimateFees(address, amount);

      // Then
      expect(result).toEqual(BigInt(287));
    });
  });

  describe("listOperations", () => {
    it("returns a list regarding address parameter", async () => {
      // When
      const result = await module.listOperations(address, 0);

      // Then
      expect(result.length).toBeGreaterThanOrEqual(1);
      result.forEach(operation => {
        expect(operation.address).toEqual(address);
        const isSenderOrReceipt =
          operation.senders.includes(address) || operation.recipients.includes(address);
        expect(isSenderOrReceipt).toBeTruthy();
      });
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
    it("returns a raw transaction", async () => {
      // When
      const result = await module.craftTransaction(address, {
        recipient: "tz1aWXP237BLwNHJcCD4b3DutCevhqq2T1Z9",
        amount: BigInt(10),
        fee: BigInt(1),
      });

      // Then
      expect(result.slice(64)).toEqual(
        "6c0053ddb3b3a89ed5c8d8326066032beac6de225c9e010300000a0000a31e81ac3425310e3274a4698a793b2839dc0afa00",
      );
    });
  });

  describe("combine", () => {
    it.skip("returns a signed raw transaction", async () => {
      // Given
      // const rawTx =
      //   "120000228000000024001BCDA6201B001F018161400000000000000A6840000000000000018114CF30F590D7A9067B2604D80D46090FBF342EBE988314CA26FB6B0EF6859436C2037BA0A9913208A59B98";
      // const signedTx = sign(
      //   encodeForSigning({
      //     ...decode(rawTx),
      //     SigningPubKey: xrpPubKey,
      //   }),
      //   xrpSecretKey,
      // );

      // When
      // const result = await module.combine(rawTx, signedTx);

      // Then
      // expect(result).toEqual(
      //   "120000228000000024001BCDA6201B001F018161400000000000000A68400000000000000174473045022100D3B9B37F40961A8DBDE48535F9EF333E87F9D98BE90F7141E133541874826BDB0220065E9CA4D218F16087656BC30D66672F6103B03717A59FFC04C837A2157CE47C8114CF30F590D7A9067B2604D80D46090FBF342EBE988314CA26FB6B0EF6859436C2037BA0A9913208A59B98",
      // );
    });
  });
});

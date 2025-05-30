import { Deserializer, Hex, Network, RawTransaction } from "@aptos-labs/ts-sdk";
import { createApi } from "../../api";
import { getEnv } from "@ledgerhq/live-env";
import type { AptosSender } from "../../types/assets";
import { DEFAULT_GAS, DEFAULT_GAS_PRICE } from "../../constants";

describe("createApi", () => {
  const api = createApi({
    aptosSettings: {
      network: Network.MAINNET,
      fullnode: getEnv("APTOS_API_ENDPOINT"),
      indexer: getEnv("APTOS_INDEXER_ENDPOINT"),
    },
  });

  const sender: AptosSender = {
    xpub: "0xd1a8c6a1cdd52dd40c7ea61ee4571fb51fcae440a594c1eca18636928f1d3956",
    freshAddress: "0x445fa0013887abd1a0c14acdec6e48090e0ad3fed3e08202aac15ca14f3be26b",
  };
  const recipient: AptosSender = {
    xpub: "0x64159425ccc6e755b91dc801b93d182af978c4624d9064facaa9b147544db87f",
    freshAddress: "0x24dbf71ba20209753035505c51d4607ed67aa0c81b930d9ef4483ec84b349fcb",
  };

  const tokenAccount: AptosSender = {
    xpub: "eacada8192f15185637e475d7783e14486e232d8b9978ffa127383847ffc5318",
    freshAddress: "0xb8922507317d85197d70c2bc1afc949c759fd0a62c8841a4300d1e2b63649bf6",
  };

  describe("lastBlock", () => {
    it("returns the last block information", async () => {
      const lastBlock = await api.lastBlock();

      expect(lastBlock).toHaveProperty("hash");
      expect(Hex.isValid(lastBlock.hash ?? "").valid).toBeTruthy();

      expect(lastBlock).toHaveProperty("height");
      expect(lastBlock.height).toBeGreaterThan(0);

      expect(lastBlock).toHaveProperty("time");
      expect(lastBlock.time).not.toBeUndefined();
      expect(lastBlock.time?.getFullYear()).toBeGreaterThan(0);
      expect(lastBlock.time?.getMonth()).toBeGreaterThan(0);
      expect(lastBlock.time?.getDay()).toBeGreaterThan(0);
    });
  });

  describe("estimateFees", () => {
    it("returns a default value", async () => {
      const amount = BigInt(100);

      const fees = await api.estimateFees({
        asset: {
          type: "native",
        },
        type: "send",
        sender,
        amount,
        recipient: recipient.freshAddress,
      });

      expect(fees.value).toBeGreaterThanOrEqual(0);
    });
  });

  describe("craftTransaction", () => {
    it("returns a RawTransaction serialized into an hexadecimal string", async () => {
      const hex = await api.craftTransaction(
        {
          amount: 1n,
          sender: sender,
          recipient: recipient.freshAddress,
          type: "send",
          asset: { type: "native" },
        },
        0n,
      );

      const rawTx = RawTransaction.deserialize(
        new Deserializer(Hex.fromHexString(hex).toUint8Array()),
      );

      expect(rawTx.sender.toString()).toBe(sender.freshAddress);
      expect(rawTx.gas_unit_price.toString()).toBe(DEFAULT_GAS_PRICE.toString());
      expect(rawTx.max_gas_amount.toString()).toBe(DEFAULT_GAS.toString());
    });
  });

  describe("getBalance", () => {
    it("return balances from account", async () => {
      const balances = await api.getBalance(sender.freshAddress);

      expect(balances.length).toBeGreaterThan(0);
      expect(balances[0].value).toBeGreaterThan(0);
    });
  });

  describe("listOperations", () => {
    it("returns operations from account", async () => {
      const block = await api.lastBlock();

      const [operations] = await api.listOperations(sender.freshAddress, {
        minHeight: block.height,
      });

      expect(operations).toBeInstanceOf(Array);
      expect(operations.length).toBeGreaterThanOrEqual(1);

      const txINHash = "0xf8c8a486c8e0c0c530f92ea5b26220829e8f8e24f8b0d9f35b57dbd804d36daf";
      const txOUTHash = "0xf980601fe40ad1dab0cc68fe08d2bc95c73e2a21c6d257475e0879394638058e";

      const operationIN = operations.find(operation => operation.id === txINHash);
      const operationOUT = operations.find(operation => operation.id === txOUTHash);

      expect(operationIN).toMatchObject({
        type: "IN",
        value: 20000000n,
        recipients: [sender.freshAddress],
        senders: ["0xa0d8abc262e3321f87d745bd5d687e8f3fb14c87d48f840b6b56867df0026ec8"],
        asset: { type: "native" },
        tx: {
          hash: "0xf8c8a486c8e0c0c530f92ea5b26220829e8f8e24f8b0d9f35b57dbd804d36daf",
          block: { height: 0 },
          fees: 1100n,
          date: new Date("2025-03-11T16:27:53.180Z"),
        },
      });

      expect(operationOUT).toMatchObject({
        type: "OUT",
        value: 119900n,
        recipients: ["0xd20fa44192f94ba086ab16bfdf57e43ff118ada69b4c66fa9b9a9223cbc068c1"],
        senders: [sender.freshAddress],
        asset: { type: "native" },
        tx: {
          hash: "0xf980601fe40ad1dab0cc68fe08d2bc95c73e2a21c6d257475e0879394638058e",
          block: { height: 0 },
          fees: 99900n,
          date: new Date("2024-12-18T14:14:59.703Z"),
        },
      });
    });
  });

  // TODO: enable when aptos token will be enabled
  describe.skip("listOperationsTokens", () => {
    it("returns operations from account", async () => {
      const block = await api.lastBlock();

      const [operations] = await api.listOperations(tokenAccount.freshAddress, {
        minHeight: block.height,
      });

      expect(operations).toBeInstanceOf(Array);
      expect(operations.length).toBeGreaterThanOrEqual(1);

      const txINNativeHash = "0xd841b502ce333e5b9ac394db81e6597d9bbbe475e5b12966b98b843d91cc0a09";
      const txOUTNativeHash = "0xb1114396c5b6f2f5ba955fa8e4102d0e3983d5ccdb0717ff792f6e4848e72366";

      const txINLegacyCoinHash =
        "0x6869c933396d976af85b273a825fe264a910d0064fe28ce97285073b9e5306bb";
      const txOUTLegacyCoinHash =
        "0xa720db7fe6327b1db23e778df5856ab1d8785d7e8edae98941a3f6e05fa58ddd";

      const txINFungibleAssetHash =
        "0x88856968603dee4f08579036bc30322b9a5f329561656888e3467ce27cc11ea7";
      const txOUTFungibleAssetHash =
        "0x8aa9e980760fe8aeb6804f387350b3019a2471aa61a5506a260c32cd5d6db32c";

      const operationIN = operations.find(operation => operation.id === txINNativeHash);
      const operationOUT = operations.find(operation => operation.id === txOUTNativeHash);

      expect(operationIN).toMatchObject({
        type: "IN",
        value: 1000000n,
        recipients: [tokenAccount.freshAddress],
        senders: ["0x24dbf71ba20209753035505c51d4607ed67aa0c81b930d9ef4483ec84b349fcb"],
        asset: { type: "native" },
        tx: {
          hash: "0xd841b502ce333e5b9ac394db81e6597d9bbbe475e5b12966b98b843d91cc0a09",
          block: { height: 0 },
          fees: 99900n,
          date: new Date("2025-05-29T18:32:11.515Z"),
        },
      });

      expect(operationOUT).toMatchObject({
        type: "OUT",
        value: 951100n,
        recipients: ["0x24dbf71ba20209753035505c51d4607ed67aa0c81b930d9ef4483ec84b349fcb"],
        senders: [tokenAccount.freshAddress],
        asset: { type: "native" },
        tx: {
          hash: "0xb1114396c5b6f2f5ba955fa8e4102d0e3983d5ccdb0717ff792f6e4848e72366",
          block: { height: 0 },
          fees: 1100n,
          date: new Date("2025-05-29T18:39:57.864Z"),
        },
      });

      const coinIN = operations.find(operation => operation.id === txINLegacyCoinHash);
      const coinOUT = operations.find(operation => operation.id === txOUTLegacyCoinHash);

      expect(coinIN).toMatchObject({
        type: "IN",
        value: 2000000n,
        recipients: [tokenAccount.freshAddress],
        senders: ["0x24dbf71ba20209753035505c51d4607ed67aa0c81b930d9ef4483ec84b349fcb"],
        asset: {
          type: "token",
          standard: "coin",
          contractAddress:
            "0xd11107bdf0d6d7040c6c0bfbdecb6545191fdf13e8d8d259952f53e1713f61b5::staked_coin::StakedAptos",
        },
        tx: {
          hash: "0x6869c933396d976af85b273a825fe264a910d0064fe28ce97285073b9e5306bb",
          block: { height: 0 },
          fees: 51100n,
          date: new Date("2025-05-29T18:32:58.804Z"),
        },
      });

      expect(coinOUT).toMatchObject({
        type: "OUT",
        value: 1000000n,
        recipients: ["0x24dbf71ba20209753035505c51d4607ed67aa0c81b930d9ef4483ec84b349fcb"],
        senders: [tokenAccount.freshAddress],
        asset: {
          type: "token",
          standard: "coin",
          contractAddress:
            "0xd11107bdf0d6d7040c6c0bfbdecb6545191fdf13e8d8d259952f53e1713f61b5::staked_coin::StakedAptos",
        },
        tx: {
          hash: "0xa720db7fe6327b1db23e778df5856ab1d8785d7e8edae98941a3f6e05fa58ddd",
          block: { height: 0 },
          fees: 1200n,
          date: new Date("2025-05-29T18:38:08.283Z"),
        },
      });

      const fungibleAssetIN = operations.find(operation => operation.id === txINFungibleAssetHash);
      const fungibleAssetOUT = operations.find(
        operation => operation.id === txOUTFungibleAssetHash,
      );

      expect(fungibleAssetIN).toMatchObject({
        type: "IN",
        value: 1750n,
        recipients: [tokenAccount.freshAddress],
        senders: ["0x24dbf71ba20209753035505c51d4607ed67aa0c81b930d9ef4483ec84b349fcb"],
        asset: {
          type: "token",
          standard: "fungible_asset",
          contractAddress: "0x2ebb2ccac5e027a87fa0e2e5f656a3a4238d6a48d93ec9b610d570fc0aa0df12",
        },
        tx: {
          hash: "0x88856968603dee4f08579036bc30322b9a5f329561656888e3467ce27cc11ea7",
          block: { height: 0 },
          fees: 54300n,
          date: new Date("2025-05-29T18:33:58.097Z"),
        },
      });

      expect(fungibleAssetOUT).toMatchObject({
        type: "OUT",
        value: 1000n,
        recipients: ["0x24dbf71ba20209753035505c51d4607ed67aa0c81b930d9ef4483ec84b349fcb"],
        senders: [tokenAccount.freshAddress],
        asset: {
          type: "token",
          standard: "fungible_asset",
          contractAddress: "0x2ebb2ccac5e027a87fa0e2e5f656a3a4238d6a48d93ec9b610d570fc0aa0df12",
        },
        tx: {
          hash: "0x8aa9e980760fe8aeb6804f387350b3019a2471aa61a5506a260c32cd5d6db32c",
          block: { height: 0 },
          fees: 1000n,
          date: new Date("2025-05-29T18:38:56.897Z"),
        },
      });
    });
  });
});

import { Deserializer, Hex, Network, RawTransaction } from "@aptos-labs/ts-sdk";
import { getEnv, setEnvUnsafe } from "@ledgerhq/live-env";
import { createApi } from "../../api";
import { DEFAULT_GAS, DEFAULT_GAS_PRICE, TOKEN_TYPE } from "../../constants";

describe("createApi", () => {
  // NOTE: as our aptos nodes and indexer whitelist calls, we need to explicitely set the LEDGER_CLIENT_VERSION
  // in turn it will be used in the headers of those api calls.
  setEnvUnsafe("LEDGER_CLIENT_VERSION", "lld/2.124.0-dev");
  const api = createApi({
    aptosSettings: {
      network: Network.MAINNET,
      fullnode: getEnv("APTOS_API_ENDPOINT"),
      indexer: getEnv("APTOS_INDEXER_ENDPOINT"),
    },
  });
  const assetTypeNative = "native";

  const sender = {
    xpub: "0x934887885b27a0407bf8a5e0bbc6b6371254bea94de5510e948bcc92dc0a519b",
    freshAddress: "0x0ef3b40f6ecd5583218d1985e0d54b54e8785ad2ec2d27ed1720ec16bb11686f",
  };

  const recipient = {
    xpub: "0x7fd6bfaac17c2c763f624b1f95cd4911e3646a5b777b03cc24f93ed0ac3f3e2b",
    freshAddress: "0x4859a161dfe13081cf5a5eac409cd38f707c06176a21ddc875260c2ce63f3a28",
  };

  const tokenAccount = {
    xpub: "0xeacada8192f15185637e475d7783e14486e232d8b9978ffa127383847ffc5318",
    freshAddress: "0xb8922507317d85197d70c2bc1afc949c759fd0a62c8841a4300d1e2b63649bf6",
  };

  describe("lastBlock", () => {
    it("returns the last block information", async () => {
      const lastBlock = await api.lastBlock();
      expect(lastBlock).toHaveProperty("hash");
      expect(Hex.isValid(lastBlock.hash ?? "").valid).toBe(true);

      expect(lastBlock).toHaveProperty("height");
      expect(lastBlock.height).toBeGreaterThan(0);

      const time = lastBlock.time as Date;

      expect(lastBlock).toHaveProperty("time");
      expect(lastBlock.time).toBeInstanceOf(Date);
      expect(time.getFullYear()).toBeGreaterThan(0);
      expect(time.getMonth() + 1).toBeGreaterThan(0);
      expect(time.getDay() + 1).toBeGreaterThan(0);
    });
  });

  describe("estimateFees", () => {
    it("returns fee for a native asset", async () => {
      const amount = BigInt(100);

      const fees = await api.estimateFees({
        intentType: "transaction",
        asset: {
          type: "native",
        },
        type: "send",
        sender: sender.freshAddress,
        senderPublicKey: sender.xpub,
        amount,
        recipient: recipient.freshAddress,
      });

      expect(fees.value).toBeGreaterThanOrEqual(0);
    });

    it("returns fee for a token coin", async () => {
      const amount = BigInt(100);

      const fees = await api.estimateFees({
        intentType: "transaction",
        asset: {
          type: "coin",
          assetReference:
            "0x50788befc1107c0cc4473848a92e5c783c635866ce3c98de71d2eeb7d2a34f85::usdc_coin::USDCoin",
        },
        type: "send",
        sender: sender.freshAddress,
        senderPublicKey: sender.xpub,
        amount,
        recipient: recipient.freshAddress,
      });

      expect(fees.value).toBeGreaterThanOrEqual(0);
    });

    it("returns fee for a token FA", async () => {
      const amount = BigInt(100);

      const fees = await api.estimateFees({
        intentType: "transaction",
        asset: {
          type: "fungible_asset",
          assetReference: "0x357b0b74bc833e95a115ad22604854d6b0fca151cecd94111770e5d6ffc9dc2b",
        },
        type: "send",
        sender: sender.freshAddress,
        senderPublicKey: sender.xpub,
        amount,
        recipient: recipient.freshAddress,
      });

      expect(fees.value).toBeGreaterThanOrEqual(0);
    });
  });

  describe("craftTransaction", () => {
    it("returns a native coin RawTransaction serialized into an hexadecimal string", async () => {
      const { transaction: hex } = await api.craftTransaction(
        {
          intentType: "transaction",
          amount: 1n,
          sender: sender.freshAddress,
          senderPublicKey: sender.xpub,
          recipient: recipient.freshAddress,
          type: "send",
          asset: { type: "native" },
        },
        { value: 0n },
      );

      const rawTx = RawTransaction.deserialize(
        new Deserializer(Hex.fromHexString(hex).toUint8Array()),
      );

      expect(rawTx.sender.toString()).toBe(sender.freshAddress);
      expect(rawTx.gas_unit_price.toString()).toBe(DEFAULT_GAS_PRICE.toString());
      expect(rawTx.max_gas_amount.toString()).toBe(DEFAULT_GAS.toString());
    });

    it("returns a coin token RawTransaction serialized into an hexadecimal string", async () => {
      const { transaction: hex } = await api.craftTransaction(
        {
          intentType: "transaction",
          amount: 1n,
          sender: sender.freshAddress,
          senderPublicKey: sender.xpub,
          recipient: recipient.freshAddress,
          type: "send",
          asset: {
            type: "coin",
            assetReference:
              "0x50788befc1107c0cc4473848a92e5c783c635866ce3c98de71d2eeb7d2a34f85::aptos_coin::AptosCoin",
          },
        },
        { value: 0n },
      );

      const rawTx = RawTransaction.deserialize(
        new Deserializer(Hex.fromHexString(hex).toUint8Array()),
      );

      expect(rawTx.sender.toString()).toBe(sender.freshAddress);
      expect(rawTx.gas_unit_price.toString()).toBe(DEFAULT_GAS_PRICE.toString());
      expect(rawTx.max_gas_amount.toString()).toBe(DEFAULT_GAS.toString());
    });

    it("returns a use-all-amount coin token RawTransaction serialized into an hexadecimal string", async () => {
      const { transaction: hex } = await api.craftTransaction(
        {
          intentType: "transaction",
          amount: 0n,
          sender: sender.freshAddress,
          senderPublicKey: sender.xpub,
          recipient: recipient.freshAddress,
          type: "send",
          asset: {
            type: "coin",
            assetReference:
              "0x50788befc1107c0cc4473848a92e5c783c635866ce3c98de71d2eeb7d2a34f85::aptos_coin::AptosCoin",
          },
        },
        { value: 0n },
      );

      const rawTx = RawTransaction.deserialize(
        new Deserializer(Hex.fromHexString(hex).toUint8Array()),
      );

      expect(rawTx.sender.toString()).toBe(sender.freshAddress);
      expect(rawTx.gas_unit_price.toString()).toBe(DEFAULT_GAS_PRICE.toString());
      expect(rawTx.max_gas_amount.toString()).toBe(DEFAULT_GAS.toString());
    });

    it("returns a use-all-amount fungible_asset token RawTransaction serialized into an hexadecimal string", async () => {
      const r = sender;
      const s = recipient; // recipient contains fungible_assets balances
      const { transaction: hex } = await api.craftTransaction(
        {
          intentType: "transaction",
          amount: 0n,
          sender: s.freshAddress,
          senderPublicKey: s.xpub,
          recipient: r.freshAddress,
          type: "send",
          asset: {
            type: "fungible_asset",
            assetReference: "0x2ebb2ccac5e027a87fa0e2e5f656a3a4238d6a48d93ec9b610d570fc0aa0df12",
          },
        },
        { value: 0n },
      );

      const rawTx = RawTransaction.deserialize(
        new Deserializer(Hex.fromHexString(hex).toUint8Array()),
      );

      expect(rawTx.sender.toString()).toBe(s.freshAddress);
      expect(rawTx.gas_unit_price.toString()).toBe(DEFAULT_GAS_PRICE.toString());
      expect(rawTx.max_gas_amount.toString()).toBe(DEFAULT_GAS.toString());
    });
  });

  describe("getBalances", () => {
    it("returned balances should have one native asset", async () => {
      const balances = await api.getBalance(sender.freshAddress);
      const nativeBalance = balances.filter(b => b.asset.type === assetTypeNative);
      expect(nativeBalance.length).toBe(1);
      expect(nativeBalance[0].value).toBeGreaterThan(0);
    });

    it("returned balances should have a token asset", async () => {
      const balances = await api.getBalance(tokenAccount.freshAddress);
      const tokenBalances = balances.filter(
        b =>
          b.asset.type === TOKEN_TYPE.FUNGIBLE_ASSET &&
          b.asset.assetReference ===
            "0x2ebb2ccac5e027a87fa0e2e5f656a3a4238d6a48d93ec9b610d570fc0aa0df12",
      );
      expect(tokenBalances.length).toBeGreaterThan(0);
      expect(balances.length).toBeGreaterThan(1);
      expect(balances[0].value).toBeGreaterThan(0);
    });

    it("should return 0 for an address with 0 balance", async () => {
      const result = await api.getBalance(
        "0xbaeab99276f87a8751210a061952f8d0aad6923c8d9657f3b04f4db99d3a784f",
      );
      expect(result).toEqual([{ value: BigInt(0), asset: { type: "native" } }]);
    });
  });

  describe("listOperations", () => {
    it("returns operations from account", async () => {
      const block = await api.lastBlock();

      const { items: operations } = await api.listOperations(sender.freshAddress, {
        minHeight: block.height,
        order: "asc",
      });

      expect(operations).toBeInstanceOf(Array);
      expect(operations.length).toBeGreaterThanOrEqual(2);

      const txINHash = "0xe1987b67878faff326a179d59ab0f5df89cc10cdcbccab1147b52735579832a5";
      const txOUTHash = "0xee3866ab35797a39102aeff6bdeb70d3d4df65adedf9efedfddad88f27dc6fa4";

      const operationIN = operations.find(operation => operation.id === txINHash);
      const operationOUT = operations.find(operation => operation.id === txOUTHash);

      expect(operationIN).toMatchObject({
        type: "IN",
        value: 11000000n,
        recipients: [sender.freshAddress],
        senders: ["0x24dbf71ba20209753035505c51d4607ed67aa0c81b930d9ef4483ec84b349fcb"],
        asset: { type: "native" },
        tx: {
          hash: "0xe1987b67878faff326a179d59ab0f5df89cc10cdcbccab1147b52735579832a5",
          fees: 99900n,
          date: new Date("2025-05-29T13:16:30.763Z"),
        },
      });

      expect(operationOUT).toMatchObject({
        type: "OUT",
        value: 2000000n,
        recipients: ["0x4859a161dfe13081cf5a5eac409cd38f707c06176a21ddc875260c2ce63f3a28"],
        senders: [sender.freshAddress],
        asset: { type: "native" },
        tx: {
          hash: "0xee3866ab35797a39102aeff6bdeb70d3d4df65adedf9efedfddad88f27dc6fa4",
          fees: 1100n,
          date: new Date("2025-05-29T13:39:28.702Z"),
        },
      });
    });
  });

  describe("listOperationsTokens", () => {
    it("returns operations from account", async () => {
      const block = await api.lastBlock();

      const { items: operations } = await api.listOperations(tokenAccount.freshAddress, {
        minHeight: block.height,
        order: "asc",
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
          type: "coin",
          assetReference:
            "0xd11107bdf0d6d7040c6c0bfbdecb6545191fdf13e8d8d259952f53e1713f61b5::staked_coin::StakedAptos",
        },
        tx: {
          hash: "0x6869c933396d976af85b273a825fe264a910d0064fe28ce97285073b9e5306bb",
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
          type: "coin",
          assetReference:
            "0xd11107bdf0d6d7040c6c0bfbdecb6545191fdf13e8d8d259952f53e1713f61b5::staked_coin::StakedAptos",
        },
        tx: {
          hash: "0xa720db7fe6327b1db23e778df5856ab1d8785d7e8edae98941a3f6e05fa58ddd",
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
          type: "fungible_asset",
          assetReference: "0x2ebb2ccac5e027a87fa0e2e5f656a3a4238d6a48d93ec9b610d570fc0aa0df12",
        },
        tx: {
          hash: "0x88856968603dee4f08579036bc30322b9a5f329561656888e3467ce27cc11ea7",
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
          type: "fungible_asset",
          assetReference: "0x2ebb2ccac5e027a87fa0e2e5f656a3a4238d6a48d93ec9b610d570fc0aa0df12",
        },
        tx: {
          hash: "0x8aa9e980760fe8aeb6804f387350b3019a2471aa61a5506a260c32cd5d6db32c",
          fees: 1000n,
          date: new Date("2025-05-29T18:38:56.897Z"),
        },
      });
    });
  });
});

import { ZCASH_NU6_ACTIVATION_HEIGHT } from "../src/constants";
import { getDefaultVersions } from "../src/createTransaction";
import { openTransportReplayer, RecordStore } from "@ledgerhq/hw-transport-mocker";
import Btc from "../src/Btc";

describe("createTransaction", () => {
  describe("createTransaction", () => {
    test("zcash", async () => {
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
        => b001000000
        <= 01055a6361736805322e332e3101029000
        => e04200000d00000000050000800a27a72601
        <= 9000
        => e0428000251d73f1a467297aab205ee7a4ed506f28ea558056401b4f6d308016c1b58d27f4010000006a
        <= 9000
        => e0428000324730440220337050efe67689fdbdccd2058f6f7b7fe3b13070d91cd0d7ecb1f84e622a220b02201356d33259d64db1095879
        <= 9000
        => e042800032cfce666b016771cf4e239376497b7f82efedd9c54a01210396fcfd94e1bfb2949e0acbab934583c11ad29d14105d25528aff
        <= 9000
        => e04280000a75673c50650c00000000
        <= 9000
        => e04280000102
        <= 9000
        => e04280002250c30000000000001976a914de3542c396924ada3c5850225770f6dd3e2249b988ac
        <= 9000
        => e0428000223df2c202000000001976a914fc0da061ca85923e01d97ac276aa8dc890a28efa88ac
        <= 9000
        => e042800009000000000400000000
        <= 3200ed40989caa0731d6526fe4e03d49c54720be148f911924129e15d7ecf6e190829edb0000000050c3000000000000d53c396d2f5c98619000
        => e04200000d00000000060000800a27a72601
        <= 9000
        => e0428000258c63f70704d9987dafffc5481b171dee900e9b6d71261fee880543bc96c41d11000000006b
        <= 9000
        => e04280003248304502210098a92ce696ff51d46233885e5ea7d0bc0bcd04621c6d79e4230e579f9b13f1480220772d04b65133859ef7fb
        <= 9000
        => e042800032146a41080b1187335fed9daf62a237b6bd54657f555d0121039402a22682e936ab3c1e2f649859ba13b39a59bd74212ac903
        <= 9000
        => e04280000ba42b5aea50327900000000
        <= 00009000
        => e04280000102
        <= 9000
        => e042800022404b4c00000000001976a914c59ace9b52af703379f3f89ebbc8ec1813ca50ec88ac
        <= 9000
        => e0428000220e532a00000000001976a9144cd6509f71020b6a9e890bef43c4d5e61f9c0dad88ac
        <= 9000
        => e042800009000000000400000000
        <= 320071857203407d7ff3f5832db7c37973ac01569a832cd78a6dbd3627e4f9ee7458532200000000404b4c0000000000aa2ea74bcab3a20a9000

        => e04000000d03800000000000000000000000
        <= 9000
        => e04000000100
        <= 9000
        => e0440000050100000002
        <= 9000

        => e04480003b01383200ed40989caa0731d6526fe4e03d49c54720be148f911924129e15d7ecf6e190829edb0000000050c3000000000000d53c396d2f5c986119
        <= 9000
        => e04480001d76a914de3542c396924ada3c5850225770f6dd3e2249b988ac00000000
        <= 009000
        => e04480003b0138320071857203407d7ff3f5832db7c37973ac01569a832cd78a6dbd3627e4f9ee7458532200000000404b4c0000000000aa2ea74bcab3a20a19
        <= 00009000

        => e04480001d76a914c59ace9b52af703379f3f89ebbc8ec1813ca50ec88ac00000000
        <= 00009000

        => e04a0000320210270000000000001976a9140fef7d9e0afcc8e198ac049945b6499b6fe7aef288ac1a314700000000001976a914d83e71
        <= 00009000

        => e04a800013f7a39b28a617c7bcedbd925c2a621952b288ac
        <= 00009000

        => e04800001303800000000000000000000000000000000001
        <= 00009000


        => e0440080050100000002
        <= 9000

        => e04480803b01383200ed40989caa0731d6526fe4e03d49c54720be148f911924129e15d7ecf6e190829edb0000000050c3000000000000d53c396d2f5c986100
        <= 9000
        => e04480800400000000
        <= 9000

        => e04480803b0138320071857203407d7ff3f5832db7c37973ac01569a832cd78a6dbd3627e4f9ee7458532200000000404b4c0000000000aa2ea74bcab3a20a19
        <= 9000

        => e04480801d76a914c59ace9b52af703379f3f89ebbc8ec1813ca50ec88ac00000000
        <= 314402200e4952c0763be7e81f342e80042ea0858911aa3c460b90698195f014ddc8bf120220723b14f186ad7a66829982f00210e8ae6289284a146ed90b706d9e0e3313ae12019000

        => e04a0000320210270000000000001976a9140fef7d9e0afcc8e198ac049945b6499b6fe7aef288ac1a314700000000001976a914d83e71
        <= 9000
        => e04a800013f7a39b28a617c7bcedbd925c2a621952b288ac
        <= 9000

        => e04800000700000000000001
        <= 9000

        => e04800001f058000002c8000008580000001000000000000000a00000000000100000000
        <= 3045022100fd7bcbec98aaa7768774db3a289e07d951a727cb65b6fbfb48e23c745c3a7d16022046f2246519789af567d970b396c9c8c5c462e5a13709ea93481b512479bdf2b3019000
        `),
      );
      /*

splitTransaction 050000800a27a726b4d0d6c20000000000000000011d73f1a467297aab205ee7a4ed506f28ea558056401b4f6d308016c1b58d27f4010000006a4730440220337050efe67689fdbdccd2058f6f7b7fe3b13070d91cd0d7ecb1f84e622a220b02201356d33259d64db1095879cfce666b016771cf4e239376497b7f82efedd9c54a01210396fcfd94e1bfb2949e0acbab934583c11ad29d14105d25528aff75673c50650c000000000250c30000000000001976a914de3542c396924ada3c5850225770f6dd3e2249b988ac3df2c202000000001976a914fc0da061ca85923e01d97ac276aa8dc890a28efa88ac000000:
TX version 05000080 locktime 00000000 timestamp  nVersionGroupId 0a27a726 nExpiryHeight 00000000 extraData 
input 0: prevout 1d73f1a467297aab205ee7a4ed506f28ea558056401b4f6d308016c1b58d27f401000000 script 4730440220337050efe67689fdbdccd2058f6f7b7fe3b13070d91cd0d7ecb1f84e622a220b02201356d33259d64db1095879cfce666b016771cf4e239376497b7f82efedd9c54a01210396fcfd94e1bfb2949e0acbab934583c11ad29d14105d25528aff75673c50650c sequence 00000000
output 0: amount 50c3000000000000 script 76a914de3542c396924ada3c5850225770f6dd3e2249b988ac
output 1: amount 3df2c20200000000 script 76a914fc0da061ca85923e01d97ac276aa8dc890a28efa88ac
      */
      // This test covers the old bitcoin Nano app 1.6 API, before the breaking changes that occurred in v2.1.0 of the app
      const btc = new Btc({ transport, currency: "zcash" });
      const tx1 = btc.splitTransaction(
        "050000800a27a726b4d0d6c20000000000000000011d73f1a467297aab205ee7a4ed506f28ea558056401b4f6d308016c1b58d27f4010000006a4730440220337050efe67689fdbdccd2058f6f7b7fe3b13070d91cd0d7ecb1f84e622a220b02201356d33259d64db1095879cfce666b016771cf4e239376497b7f82efedd9c54a01210396fcfd94e1bfb2949e0acbab934583c11ad29d14105d25528aff75673c50650c000000000250c30000000000001976a914de3542c396924ada3c5850225770f6dd3e2249b988ac3df2c202000000001976a914fc0da061ca85923e01d97ac276aa8dc890a28efa88ac000000",
        true,
        true,
        ["zcash", "sapling"],
      );
      /*
       splitTransaction 050000800a27a7265510e7c80000000000000000018c63f70704d9987dafffc5481b171dee900e9b6d71261fee880543bc96c41d11000000006b48304502210098a92ce696ff51d46233885e5ea7d0bc0bcd04621c6d79e4230e579f9b13f1480220772d04b65133859ef7fb146a41080b1187335fed9daf62a237b6bd54657f555d0121039402a22682e936ab3c1e2f649859ba13b39a59bd74212ac903a42b5aea5032790000000002404b4c00000000001976a914c59ace9b52af703379f3f89ebbc8ec1813ca50ec88ac0e532a00000000001976a9144cd6509f71020b6a9e890bef43c4d5e61f9c0dad88ac000000:
TX version 05000080 locktime 00000000 timestamp  nVersionGroupId 0a27a726 nExpiryHeight 00000000 extraData 
input 0: prevout 8c63f70704d9987dafffc5481b171dee900e9b6d71261fee880543bc96c41d1100000000 script 48304502210098a92ce696ff51d46233885e5ea7d0bc0bcd04621c6d79e4230e579f9b13f1480220772d04b65133859ef7fb146a41080b1187335fed9daf62a237b6bd54657f555d0121039402a22682e936ab3c1e2f649859ba13b39a59bd74212ac903a42b5aea503279 sequence 00000000
output 0: amount 404b4c0000000000 script 76a914c59ace9b52af703379f3f89ebbc8ec1813ca50ec88ac
output 1: amount 0e532a0000000000 script 76a9144cd6509f71020b6a9e890bef43c4d5e61f9c0dad88ac
      */
      const tx2 = btc.splitTransaction(
        "050000800a27a7265510e7c80000000000000000018c63f70704d9987dafffc5481b171dee900e9b6d71261fee880543bc96c41d11000000006b48304502210098a92ce696ff51d46233885e5ea7d0bc0bcd04621c6d79e4230e579f9b13f1480220772d04b65133859ef7fb146a41080b1187335fed9daf62a237b6bd54657f555d0121039402a22682e936ab3c1e2f649859ba13b39a59bd74212ac903a42b5aea5032790000000002404b4c00000000001976a914c59ace9b52af703379f3f89ebbc8ec1813ca50ec88ac0e532a00000000001976a9144cd6509f71020b6a9e890bef43c4d5e61f9c0dad88ac000000",
        true,
        true,
        ["zcash", "sapling"],
      );
      const result = await btc.createPaymentTransaction({
        inputs: [
          [tx1, 0, null, 0, 1806010],
          [tx2, 0, null, 0, 2733284],
        ],
        associatedKeysets: ["0'/0/0"],
        changePath: undefined,
        blockHeight: 2812009,
        sigHashType: 1,
        outputScriptHex:
          "0210270000000000001976a9140fef7d9e0afcc8e198ac049945b6499b6fe7aef288ac1a314700000000001976a914d83e71f7a39b28a617c7bcedbd925c2a621952b288ac",
        additionals: ["zcash", "sapling"],
      });
      expect(result).toEqual(
        "010000005510e7c8000000000000000002989caa0731d6526fe4e03d49c54720be148f911924129e15d7ecf6e190829edb00000000050230000102000000007203407d7ff3f5832db7c37973ac01569a832cd78a6dbd3627e4f9ee745853220000000003000102000000000210270000000000001976a9140fef7d9e0afcc8e198ac049945b6499b6fe7aef288ac1a314700000000001976a914d83e71f7a39b28a617c7bcedbd925c2a621952b288ac000000",
      );
    });
  });
  describe("getDefaultVersions", () => {
    it("should return default versions for non-Zcash and non-Decred with no expiryHeight", () => {
      const result = getDefaultVersions({
        isZcash: false,
        sapling: false,
        isDecred: false,
        expiryHeight: undefined,
        blockHeight: undefined,
      });
      expect(result.defaultVersion.readUInt32LE(0)).toBe(1);
      expect(result.defaultVersionNu5Only.readUInt32LE(0)).toBe(1);
    });

    it("should return Zcash versions with expiryHeight and blockHeight below activation height", () => {
      const result = getDefaultVersions({
        isZcash: true,
        sapling: false,
        isDecred: false,
        expiryHeight: Buffer.alloc(4),
        blockHeight: 1000,
      });
      expect(result.defaultVersion.readUInt32LE(0)).toBe(0x80000005);
      expect(result.defaultVersionNu5Only.readUInt32LE(0)).toBe(0x80000005);
    });

    it("should return Zcash versions with expiryHeight and blockHeight above activation height", () => {
      const blockHeight = 3_000_000;
      expect(blockHeight > ZCASH_NU6_ACTIVATION_HEIGHT).toBe(true);
      const result = getDefaultVersions({
        isZcash: true,
        sapling: false,
        isDecred: false,
        expiryHeight: Buffer.alloc(4),
        blockHeight: blockHeight,
      });
      expect(result.defaultVersion.readUInt32LE(0)).toBe(0x80000006);
      expect(result.defaultVersionNu5Only.readUInt32LE(0)).toBe(0x80000005);
    });

    it("should return Sapling versions with expiryHeight", () => {
      const result = getDefaultVersions({
        isZcash: false,
        sapling: true,
        isDecred: false,
        expiryHeight: Buffer.alloc(4),
        blockHeight: undefined,
      });
      expect(result.defaultVersion.readUInt32LE(0)).toBe(0x80000004);
      expect(result.defaultVersionNu5Only.readUInt32LE(0)).toBe(0x80000004);
    });

    it("should return non-Sapling versions with expiryHeight", () => {
      const result = getDefaultVersions({
        isZcash: false,
        sapling: false,
        isDecred: false,
        expiryHeight: Buffer.alloc(4),
        blockHeight: undefined,
      });
      expect(result.defaultVersion.readUInt32LE(0)).toBe(0x80000003);
      expect(result.defaultVersionNu5Only.readUInt32LE(0)).toBe(0x80000003);
    });

    it("should return default versions for Decred with expiryHeight", () => {
      const result = getDefaultVersions({
        isZcash: false,
        sapling: false,
        isDecred: true,
        expiryHeight: Buffer.alloc(4),
        blockHeight: undefined,
      });
      expect(result.defaultVersion.readUInt32LE(0)).toBe(1);
      expect(result.defaultVersionNu5Only.readUInt32LE(0)).toBe(1);
    });
  });
});

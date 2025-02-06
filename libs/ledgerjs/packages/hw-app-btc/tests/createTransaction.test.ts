import { ZCASH_NU6_ACTIVATION_HEIGHT } from "../src/constants";
import { getDefaultVersions } from "../src/createTransaction";
import { openTransportReplayer, RecordStore } from "@ledgerhq/hw-transport-mocker";
import Btc from "../src/Btc";


describe('createTransaction', () => {
  describe('createTransaction', () => {
    test("btc 2", async () => {
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
        => b001000000
        <= 0107426974636f696e06312e332e323301029000
        => e042000009000000010100000001
        <= 9000
        => e0428000254ea60aeac5252c14291d428915bd7ccd1bfc4af009f4d4dc57ae597ed0420b71010000008a
        <= 9000
        => e04280003247304402201f36a12c240dbf9e566bc04321050b1984cd6eaf6caee8f02bb0bfec08e3354b022012ee2aeadcbbfd1e92959f
        <= 9000
        => e04280003257c15c1c6debb757b798451b104665aa3010569b49014104090b15bde569386734abf2a2b99f9ca6a50656627e77de663ca7
        <= 9000
        => e04280002a325702769986cf26cc9dd7fdea0af432c8e2becc867c932e1b9dd742f2a108997c2252e2bdebffffffff
        <= 9000
        => e04280000102
        <= 9000
        => e04280002281b72e00000000001976a91472a5d75c8d2d0565b656a5232703b167d50d5a2b88ac
        <= 9000
        => e042800022a0860100000000001976a9144533f5fb9b4817f713c48f0bfe96b9f50c476c9b88ac
        <= 9000
        => e04280000400000000
        <= 32005df4c773da236484dae8f0fdba3d7e0ba1d05070d1a34fc44943e638441262a04f1001000000a086010000000000b890da969aa6f3109000
        => e04000000d03800000000000000000000000
        <= 41046666422d00f1b308fc7527198749f06fedb028b979c09f60d0348ef79c985e4138b86996b354774c434488d61c7fb20a83293ef3195d422fde9354e6cf2a74ce223137383731457244716465764c544c57424836577a6a556331454b4744517a434d41612d17bc55b7aa153ae07fba348692c2976e6889b769783d475ba7488fb547709000
        => e0440000050100000001
        <= 9000
        => e04480003b013832005df4c773da236484dae8f0fdba3d7e0ba1d05070d1a34fc44943e638441262a04f1001000000a086010000000000b890da969aa6f31019
        <= 9000
        => e04480001d76a9144533f5fb9b4817f713c48f0bfe96b9f50c476c9b88acffffffff
        <= 9000
        => e04a80002301905f0100000000001976a91472a5d75c8d2d0565b656a5232703b167d50d5a2b88ac
        <= 00009000
        => e04800001303800000000000000000000000000000000001
        <= 3145022100ff492ad0b3a634aa7751761f7e063bf6ef4148cd44ef8930164580d5ba93a17802206fac94b32e296549e2e478ce806b58d61cfacbfed35ac4ceca26ac531f92b20a019000
        `)
      );
      // This test covers the old bitcoin Nano app 1.6 API, before the breaking changes that occurred in v2.1.0 of the app
      const btc = new Btc({ transport, currency: "zcash" });
      const tx1 = btc.splitTransaction(
        "01000000014ea60aeac5252c14291d428915bd7ccd1bfc4af009f4d4dc57ae597ed0420b71010000008a47304402201f36a12c240dbf9e566bc04321050b1984cd6eaf6caee8f02bb0bfec08e3354b022012ee2aeadcbbfd1e92959f57c15c1c6debb757b798451b104665aa3010569b49014104090b15bde569386734abf2a2b99f9ca6a50656627e77de663ca7325702769986cf26cc9dd7fdea0af432c8e2becc867c932e1b9dd742f2a108997c2252e2bdebffffffff0281b72e00000000001976a91472a5d75c8d2d0565b656a5232703b167d50d5a2b88aca0860100000000001976a9144533f5fb9b4817f713c48f0bfe96b9f50c476c9b88ac00000000"
      );
      const result = await btc.createPaymentTransaction({
        inputs: [[tx1, 1, undefined, undefined]],
        associatedKeysets: ["0'/0/0"],
        changePath: undefined,
        outputScriptHex:
          "01905f0100000000001976a91472a5d75c8d2d0565b656a5232703b167d50d5a2b88ac",
        additionals: [],
      });
      console.log("RESULT")
      expect(result).toEqual(
        "0100000001c773da236484dae8f0fdba3d7e0ba1d05070d1a34fc44943e638441262a04f10010000006b483045022100ff492ad0b3a634aa7751761f7e063bf6ef4148cd44ef8930164580d5ba93a17802206fac94b32e296549e2e478ce806b58d61cfacbfed35ac4ceca26ac531f92b20a0121026666422d00f1b308fc7527198749f06fedb028b979c09f60d0348ef79c985e41ffffffff01905f0100000000001976a91472a5d75c8d2d0565b656a5232703b167d50d5a2b88ac00000000"
      );
    });
    
  });
describe('getDefaultVersions', () => {
    it('should return default versions for non-Zcash and non-Decred with no expiryHeight', () => {
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
    
      it('should return Zcash versions with expiryHeight and blockHeight below activation height', () => {
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
    
      it('should return Zcash versions with expiryHeight and blockHeight above activation height', () => {
        const blockHeight = 3_000_000;
        expect(blockHeight > ZCASH_NU6_ACTIVATION_HEIGHT).toBe(true);
        const result = getDefaultVersions({
          isZcash: true,
          sapling: false,
          isDecred: false,
          expiryHeight: Buffer.alloc(4),
          blockHeight: blockHeight,
        });
        console.log({result})
        expect(result.defaultVersion.readUInt32LE(0)).toBe(0x80000006);
        expect(result.defaultVersionNu5Only.readUInt32LE(0)).toBe(0x80000005);
      });
    
      it('should return Sapling versions with expiryHeight', () => {
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
    
      it('should return non-Sapling versions with expiryHeight', () => {
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
  
    
  it('should return default versions for Decred with expiryHeight', () => {
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
import { ZCASH_NU6_ACTIVATION_HEIGHT } from "../src/constants";
import { getDefaultVersions } from "../src/createTransaction";


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
import { sha256 } from "@noble/hashes/sha2";

export class UserHashService {
  private static hash(input: Buffer | string): Buffer {
    return Buffer.from(sha256(input));
  }

  static compute(userId: string): { firmwareSalt: string; endpointOverrides100: number } {
    const firmwareSalt = this.hash(userId + "|firmwareSalt")
      .toString("hex")
      .slice(0, 6);
    const endpointOverrides100 = this.hash(userId + "|endpoint").readUInt16BE(0) % 100;

    return {
      firmwareSalt,
      endpointOverrides100,
    };
  }
}

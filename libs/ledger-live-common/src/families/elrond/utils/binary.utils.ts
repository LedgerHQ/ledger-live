function base64DecodeBinary(str: string): Buffer {
  return Buffer.from(str, "base64");
}

export class BinaryUtils {
  static base64Encode(str: string): string {
    return Buffer.from(str).toString("base64");
  }

  static base64Decode(str: string): string {
    return base64DecodeBinary(str).toString("binary");
  }
}

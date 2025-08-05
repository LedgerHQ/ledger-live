import { CantonAddress, CantonSignature } from "@ledgerhq/coin-canton";

const INS = {
  GET_VERSION: 0x04,
  GET_ADDR: 0x05,
  SIGN: 0x06,
};

const STATUS = {
  OK: 0x9000,
  USER_CANCEL: 0x6985,
};

export type AppConfig = {
  version: string;
};

// SECP256R1-compatible mock addresses
const SECP256R1_MOCK_ADDRESSES = {
  "44'/6767'/0'/0'/0'": {
    // Uncompressed SECP256R1 public key (65 bytes: 0x04 + 32-byte X + 32-byte Y)
    publicKey:
      "0x04" +
      "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" +
      "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    address: "canton_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z",
  },
  "44'/6767'/0'/0'/1'": {
    // Another valid SECP256R1 public key
    publicKey:
      "0x04" +
      "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890" +
      "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd",
    address: "canton_2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a",
  },
};

/**
 * Mock Canton "@ledgerhq/hw-app-canton" device implementation for development and testing
 */
export class MockCantonDevice {
  private mockAddresses: Map<string, CantonAddress> = new Map();
  private mockSignatures: Map<string, CantonSignature> = new Map();

  constructor() {
    // Initialize with SECP256R1-compatible addresses
    Object.entries(SECP256R1_MOCK_ADDRESSES).forEach(([path, address]) => {
      this.mockAddresses.set(path, address);
    });
  }

  async send(cla: number, ins: number, p1: number, p2: number, data: Buffer): Promise<Buffer> {
    switch (ins) {
      case INS.GET_ADDR:
        return this.getAddressResponse(data);
      case INS.SIGN:
        return this.signTransactionResponse(data);
      case INS.GET_VERSION:
        return this.getAppConfigurationResponse();
      default:
        throw new Error(`Unsupported instruction: ${ins}`);
    }
  }

  private async getAddressResponse(data: Buffer): Promise<Buffer> {
    await this.simulateDeviceDelay();

    // Parse the path from the data
    const pathData = data.slice(1); // Skip length byte
    const path = this.parsePathFromData(pathData);

    const mockAddress = this.mockAddresses.get(path);
    if (!mockAddress) {
      // Generate SECP256R1-compatible mock address
      const pathHash = this.hashString(path);
      const newAddress: CantonAddress = {
        // Create valid uncompressed SECP256R1 public key format
        publicKey:
          "0x04" +
          pathHash.substring(0, 64).padEnd(64, "0") +
          pathHash.substring(64, 128).padEnd(64, "0"),
        address: `canton_${pathHash.substring(0, 36)}`,
      };
      this.mockAddresses.set(path, newAddress);
    }

    const address = this.mockAddresses.get(path)!;

    // Return 65-byte uncompressed public key (0x04 + 32-byte X + 32-byte Y)
    const publicKeyBytes = Buffer.from(address.publicKey.slice(2), "hex");
    const response = Buffer.alloc(65 + 2);
    publicKeyBytes.copy(response, 0);
    response.writeUInt16BE(STATUS.OK, 65);

    return response;
  }

  private async signTransactionResponse(data: Buffer): Promise<Buffer> {
    await this.simulateDeviceDelay();

    // Parse the path and transaction from the data
    const pathData = data.slice(0, 21); // First 21 bytes are path
    const txData = data.slice(21); // Rest is transaction data
    const path = this.parsePathFromData(pathData);

    const signatureKey = `${path}:${txData.toString("hex")}`;
    let signature = this.mockSignatures.get(signatureKey);

    if (!signature) {
      // Generate SECP256R1-compatible mock signature (64 bytes: r + s)
      const combinedHash = this.hashString(signatureKey);
      signature = `0x${combinedHash.substring(0, 64).padEnd(64, "0")}`;
      this.mockSignatures.set(signatureKey, signature);
    }

    // Return 64-byte signature (r + s components)
    const response = Buffer.alloc(64 + 2);
    Buffer.from(signature.slice(2), "hex").copy(response, 0); // Remove '0x' prefix
    response.writeUInt16BE(STATUS.OK, 64);

    return response;
  }

  private async getAppConfigurationResponse(): Promise<Buffer> {
    await this.simulateDeviceDelay();

    // Create response buffer: version data + status code
    const versionData = Buffer.from([0x00, 0x01, 0x00, 0x06]); // Version 0.1.0
    const response = Buffer.alloc(versionData.length + 2);
    versionData.copy(response, 0);
    response.writeUInt16BE(STATUS.OK, versionData.length);

    return response;
  }

  private parsePathFromData(data: Buffer): string {
    // Convert the path data back to a BIP32 path string
    const segments: number[] = [];
    for (let i = 0; i < data.length; i += 4) {
      const segment = data.readUInt32BE(i);
      segments.push(segment);
    }

    // Convert to BIP32 path string
    const pathParts = segments.map(seg => {
      const isHardened = (seg & 0x80000000) !== 0;
      const value = seg & 0x7fffffff;
      return isHardened ? `${value}'` : `${value}`;
    });

    return pathParts.join("/");
  }

  private async simulateDeviceDelay(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  /**
   * Simple deterministic hash function for generating mock data
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }
}

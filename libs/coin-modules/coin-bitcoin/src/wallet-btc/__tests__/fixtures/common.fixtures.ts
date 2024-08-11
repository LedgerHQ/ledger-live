import { ICrypto } from "../../crypto/types";


export const mockCrypto = {
  getAddress: jest.fn(),
  toOutputScript: jest.fn(),
  toOpReturnOutputScript: jest.fn(),
  network: {
    name: "testnet",
  },
} as unknown as jest.Mocked<ICrypto>;
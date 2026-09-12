import { matchesPasswordVerifier } from "@shared/password-verifier";
import { renderHook } from "@testing-library/react-native";
import { derivePasswordDigest } from "../adapters/passwordDigest";
import { readPasswordVerifier } from "../adapters/verifierStore";
import { usePasswordVerify } from "./usePasswordVerify";

jest.mock("../adapters/passwordDigest", () => ({
  derivePasswordDigest: jest.fn(),
  serialiseDerivation: <T>(run: () => Promise<T>) => run(),
}));

jest.mock("../adapters/verifierStore", () => ({
  readPasswordVerifier: jest.fn(),
}));

const derivePasswordDigestMock = jest.mocked(derivePasswordDigest);
const readPasswordVerifierMock = jest.mocked(readPasswordVerifier);

const verifier = {
  version: 1,
  scrypt: { cost: 2, blockSize: 1, parallelization: 1, digestLength: 4 },
  salt: new Uint8Array([1, 2, 3, 4]),
  digest: new Uint8Array([9, 9, 9, 9]),
};

describe("usePasswordVerify", () => {
  beforeEach(() => {
    derivePasswordDigestMock.mockReset();
    readPasswordVerifierMock.mockReset();
  });

  it("should accept a password that matches the stored digest", async () => {
    readPasswordVerifierMock.mockResolvedValue(verifier);
    derivePasswordDigestMock.mockResolvedValue(new Uint8Array([9, 9, 9, 9]));

    const { result } = renderHook(() => usePasswordVerify());

    await expect(result.current("secret")).resolves.toBe(true);
    expect(matchesPasswordVerifier(verifier, new Uint8Array([9, 9, 9, 9]))).toBe(true);
  });

  it("should reject a password that does not match", async () => {
    readPasswordVerifierMock.mockResolvedValue(verifier);
    derivePasswordDigestMock.mockResolvedValue(new Uint8Array([1, 1, 1, 1]));

    const { result } = renderHook(() => usePasswordVerify());

    await expect(result.current("nope")).resolves.toBe(false);
  });

  it("should reject when no verifier is stored", async () => {
    readPasswordVerifierMock.mockResolvedValue(null);

    const { result } = renderHook(() => usePasswordVerify());

    await expect(result.current("secret")).resolves.toBe(false);
    expect(derivePasswordDigestMock).not.toHaveBeenCalled();
  });
});

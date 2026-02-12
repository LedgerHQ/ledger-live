import type { Account } from "@ledgerhq/types-live";
import { signMessage } from "./hw-signMessage";

describe("signMessage", () => {
  const mockSignerContext = jest.fn();

  beforeEach(() => {
    mockSignerContext.mockReset();
  });

  it("should sign a message and return hex signature", async () => {
    const sigBytes = Buffer.from("abcd", "hex");
    mockSignerContext.mockImplementation((_deviceId: string, fn: any) =>
      fn({
        sign: jest.fn().mockResolvedValue({ signatureRS: sigBytes }),
      }),
    );

    const account = { freshAddressPath: "44'/223'/0'/0/0" } as Account;
    const result = await signMessage(mockSignerContext as any)("device-1", account, {
      message: "hello",
    });

    expect(result.signature).toBe("abcd");
    expect(result.rsv).toEqual({ r: "", s: "", v: 0 });
  });

  it("should throw when message is empty", async () => {
    const account = { freshAddressPath: "44'/223'/0'/0/0" } as Account;
    await expect(
      signMessage(mockSignerContext as any)("device-1", account, { message: "" }),
    ).rejects.toThrow("Message cannot be empty");
  });

  it("should throw when message is not a string", async () => {
    const account = { freshAddressPath: "44'/223'/0'/0/0" } as Account;
    await expect(
      signMessage(mockSignerContext as any)("device-1", account, { message: 123 as any }),
    ).rejects.toThrow("Message must be a string");
  });

  it("should throw when signatureRS is missing", async () => {
    mockSignerContext.mockImplementation((_deviceId: string, fn: any) =>
      fn({
        sign: jest.fn().mockResolvedValue({ signatureRS: null }),
      }),
    );

    const account = { freshAddressPath: "44'/223'/0'/0/0" } as Account;
    await expect(
      signMessage(mockSignerContext as any)("device-1", account, { message: "hello" }),
    ).rejects.toThrow("Signing failed");
  });
});

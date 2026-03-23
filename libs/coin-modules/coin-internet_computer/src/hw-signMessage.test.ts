import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { Account } from "@ledgerhq/types-live";
import { signMessage } from "./hw-signMessage";
import type { ICPSigner } from "./types";

describe("signMessage", () => {
  const mockSignerContext = jest.fn();

  beforeEach(() => {
    mockSignerContext.mockReset();
  });

  const makeSignerContext = (): SignerContext<ICPSigner> => mockSignerContext as any;
  const makeAccount = (): Account => ({ freshAddressPath: "44'/223'/0'/0/0" }) as any;

  it("should sign a message and return hex signature", async () => {
    const sigBytes = Buffer.from("abcd", "hex");
    mockSignerContext.mockImplementation((_deviceId: string, fn: (signer: ICPSigner) => unknown) =>
      fn({
        sign: jest.fn().mockResolvedValue({ signatureRS: sigBytes }),
      } as any),
    );

    const result = await signMessage(makeSignerContext())("device-1", makeAccount(), {
      message: "hello",
    });

    expect(result.signature).toBe("abcd");
    expect(result.rsv).toEqual({ r: "", s: "", v: 0 });
  });

  it("should throw when message is empty", async () => {
    await expect(
      signMessage(makeSignerContext())("device-1", makeAccount(), { message: "" }),
    ).rejects.toThrow("Message cannot be empty");
  });

  it("should throw when message is not a string", async () => {
    await expect(
      signMessage(makeSignerContext())("device-1", makeAccount(), {
        message: 123 as any,
      }),
    ).rejects.toThrow("Message must be a string");
  });

  it("should throw when signatureRS is missing", async () => {
    mockSignerContext.mockImplementation((_deviceId: string, fn: (signer: ICPSigner) => unknown) =>
      fn({
        sign: jest.fn().mockResolvedValue({ signatureRS: null }),
      } as any),
    );

    await expect(
      signMessage(makeSignerContext())("device-1", makeAccount(), { message: "hello" }),
    ).rejects.toThrow("Signing failed");
  });
});

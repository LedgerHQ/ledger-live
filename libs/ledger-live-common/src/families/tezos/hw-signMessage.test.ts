import type { Account } from "@ledgerhq/types-live";
import { signMessage } from "./hw-signMessage";
import type { TezosSigner } from "./types";

const DEVICE_ID = "device-1";
const RAW_SIG = "ab".repeat(64);

function makeAccount(freshAddress: string): Account {
  return {
    freshAddress,
    freshAddressPath: "44'/1729'/0'/0'",
  } as unknown as Account;
}

function setup(signOperationResult: { signature: string }) {
  const signOperation = jest.fn().mockResolvedValue(signOperationResult);
  const signer = { signOperation } as unknown as TezosSigner;
  const signerContext = jest
    .fn()
    .mockImplementation((_deviceId, fn) => Promise.resolve(fn(signer)));
  return { signOperation, signerContext };
}

describe("hw-signMessage / signMessage", () => {
  it("signs the payload verbatim without prepending a magic byte", async () => {
    const { signOperation, signerContext } = setup({ signature: RAW_SIG });
    const payload = "05010000000568656c";

    const result = await signMessage(signerContext)(DEVICE_ID, makeAccount("tz1abc"), {
      message: payload,
    });

    expect(signOperation).toHaveBeenCalledWith("44'/1729'/0'/0'", payload, { curve: 0x00 });
    expect(result).toEqual({ signature: RAW_SIG });
  });

  it("selects the curve from the address prefix (tz1→ed25519, tz2→secp256k1, tz3→p256)", async () => {
    for (const [prefix, expected] of [
      ["tz1abc", 0x00],
      ["tz2abc", 0x01],
      ["tz3abc", 0x02],
    ] as const) {
      const { signOperation, signerContext } = setup({ signature: RAW_SIG });
      await signMessage(signerContext)(DEVICE_ID, makeAccount(prefix), { message: "0501" });
      expect(signOperation).toHaveBeenCalledWith("44'/1729'/0'/0'", "0501", { curve: expected });
    }
  });

  it("normalises a DER secp256k1 signature to raw r||s", async () => {
    // DER: 30 06 02 01 0a 02 01 0b → r=0x0a, s=0x0b (each padded to 32 bytes)
    const der = "300602010a02010b";
    const { signerContext } = setup({ signature: der });

    const { signature } = await signMessage(signerContext)(DEVICE_ID, makeAccount("tz2abc"), {
      message: "0501",
    });

    expect(signature).toBe("0a".padStart(64, "0") + "0b".padStart(64, "0"));
  });

  it.each([
    ["empty", ""],
    ["odd length", "abc"],
    ["non-hex", "05zz"],
  ])("throws on an invalid (%s) payload", async (_label, payload) => {
    const { signerContext } = setup({ signature: RAW_SIG });
    await expect(
      signMessage(signerContext)(DEVICE_ID, makeAccount("tz1abc"), { message: payload }),
    ).rejects.toThrow("must be a non-empty hex-encoded payload");
  });

  it.each([
    ["a contract (KT1)", "KT1abc"],
    ["an empty", ""],
  ])("throws on %s address", async (_label, address) => {
    const { signerContext } = setup({ signature: RAW_SIG });
    await expect(
      signMessage(signerContext)(DEVICE_ID, makeAccount(address), { message: "0501" }),
    ).rejects.toThrow("must be a tz1/tz2/tz3 implicit address");
  });

  it.each([
    ["empty", ""],
    ["non-hex", "zz"],
    ["truncated DER", "3006"],
    // 33-byte r without a leading 0x00 is not valid DER and must not normalise to 33 bytes
    ["33-byte r without 0x00 pad", "302502210a" + "11".repeat(32) + "020401020304"],
  ])("throws when the device returns an invalid (%s) signature", async (_label, signature) => {
    const { signerContext } = setup({ signature });
    await expect(
      signMessage(signerContext)(DEVICE_ID, makeAccount("tz2abc"), { message: "0501" }),
    ).rejects.toThrow("device returned an invalid signature");
  });
});

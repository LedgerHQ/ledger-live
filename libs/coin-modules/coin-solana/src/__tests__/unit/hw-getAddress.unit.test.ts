import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import { PublicKey } from "@solana/web3.js";
import resolver from "../../hw-getAddress";
import { SolanaSigner } from "../../signer";

describe("hw-getAddress", () => {
  it("returns the device public key, base58-encoded, as both address and public key", async () => {
    const address = "EvnRmnMrd69kFdbLMxWkTn1icZ7DCceRhvmb2SJXqDo4";
    const getAddress = jest.fn().mockResolvedValue({ address: new PublicKey(address).toBuffer() });
    const signerContext: SignerContext<SolanaSigner> = (_deviceId, fn) =>
      fn({ getAddress } as unknown as SolanaSigner);

    const result = await resolver(signerContext)("deviceId", {
      path: "44'/501'/0'",
      verify: true,
      currency: undefined as never,
      derivationMode: "solanaMain",
    });

    expect(getAddress).toHaveBeenCalledWith("44'/501'/0'", true);
    expect(result).toEqual({ address, publicKey: address, path: "44'/501'/0'" });
  });
});

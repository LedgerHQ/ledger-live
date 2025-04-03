import { SignerContext } from "@ledgerhq/coin-framework/lib/signer";
import { Account, AnyMessage, TypedEvmMessage } from "@ledgerhq/types-live";
import { signMessage } from "../../hw-signMessage";
import { SolanaSigner } from "../../signer";

describe("Testing call to hardware off-chain sign message on Solana", () => {
  it("should sign a message off-chain on hardware and return the generated signature", async () => {
    const SIGNATURE =
      "4gVuB1KsM58fb3vRpnDucwW4Vi6fVGA51QDQd9ARvx4GH5yYVDPzDnvzUbSJf3YLWWdsX7zCMSN9N1GMnTYwWiJf";

    const signMessageMock = jest.fn((_deviceId, _messageHex) => {
      return Promise.resolve({ signature: Buffer.from(SIGNATURE) });
    });
    const solanaSigner: SolanaSigner = {
      getAddress: jest.fn(),
      signTransaction: jest.fn(),
      signMessage: signMessageMock,
    };

    const signerContext: SignerContext<SolanaSigner> = (_, fn) => fn(solanaSigner);
    const accountFreshAddressPath = "44'/501'/0'/0/0";
    const messageHex = "54 65 73 74 69 6E 67 20 6F 6E 20 53 6F 6C 61 6E 61";

    const result = await signMessage(signerContext)(
      "",
      { freshAddressPath: accountFreshAddressPath } as Account,
      { message: messageHex },
    );

    expect(result.signature).toEqual(SIGNATURE);
    expect(signMessageMock).toHaveBeenCalledTimes(1);
    expect(signMessageMock).toHaveBeenCalledWith(accountFreshAddressPath, messageHex);
  });

  it.each([{} as AnyMessage, {} as TypedEvmMessage])(
    "should throw an error when message options have not DefaultMessage type",
    async (messageOptions: AnyMessage) => {
      const signerContext: SignerContext<SolanaSigner> = (_, fn) =>
        fn({
          getAddress: jest.fn(),
          signTransaction: jest.fn(),
          signMessage: jest.fn(),
        });

      await expect(signMessage(signerContext)("", {} as Account, messageOptions)).rejects.toThrow(
        "Sign off-chain message on Solana must be only used with DefaultMessage type",
      );
    },
  );
});

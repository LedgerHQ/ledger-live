import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { Account, AnyMessage, TypedEvmMessage } from "@ledgerhq/types-live";
import { signMessage } from "../../hw-signMessage";
import { PubKeyDisplayMode, SolanaSigner } from "../../signer";
import coinConfig from "../../config";

coinConfig.setCoinConfig(() => ({
  legacyOCMSMaxVersion: "1.8.2",
  queuedInterval: 1,
  token2022Enabled: false,
  status: { type: "active" },
}));

describe("Testing call to hardware off-chain sign message on Solana", () => {
  it("should sign a message off-chain on hardware and return the generated signature", async () => {
    const APP_VERSION = "1.8.2";
    const SIGNATURE =
      "4gVuB1KsM58fb3vRpnDucwW4Vi6fVGA51QDQd9ARvx4GH5yYVDPzDnvzUbSJf3YLWWdsX7zCMSN9N1GMnTYwWiJf";

    const HEXADECIMAL_SIGNATURE =
      "3467567542314b734d35386662337652706e4475637757345669366656474135315144516439415276783447483579595644507a446e767a5562534a6633594c5757647358377a434d534e394e31474d6e54597757694a66";

    const getAppConfigurationMock = jest.fn(() => {
      return Promise.resolve({
        version: APP_VERSION,
        blindSigningEnabled: false,
        pubKeyDisplayMode: PubKeyDisplayMode.LONG,
      });
    });
    const signMessageMock = jest.fn((_deviceId, _messageHex) => {
      return Promise.resolve({ signature: Buffer.from(SIGNATURE) });
    });
    const solanaSigner: SolanaSigner = {
      getAppConfiguration: getAppConfigurationMock,
      getAddress: jest.fn(),
      signTransaction: jest.fn(),
      signMessage: signMessageMock,
    };

    const signerContext: SignerContext<SolanaSigner> = (_, fn) => fn(solanaSigner);
    const accountFreshAddressPath = "44'/501'/0'/0/0";
    const freshAddress = "8DpKDisipx6f76cEmuGvCX9TrA3SjeR76HaTRePxHBDe";
    const messageHex = "54657374696E67206F6E20536F6C616E61";
    const offchainMessage =
      "ff736f6c616e61206f6666636861696e00000000000000000000000000000000000000000000000000000000000000000000016b4a46c53959cac0eff146ab323053cfc503321adfd453a7c67c91a24be03235220035343635373337343639364536373230364636453230353336463643363136453631";

    const result = await signMessage(signerContext)(
      "",
      { freshAddressPath: accountFreshAddressPath, freshAddress } as Account,
      { message: messageHex },
    );

    expect(result.signature).toEqual("0x" + HEXADECIMAL_SIGNATURE);
    expect(signMessageMock).toHaveBeenCalledTimes(1);
    expect(signMessageMock).toHaveBeenCalledWith(accountFreshAddressPath, offchainMessage);
  });

  it("should sign a message off-chain on legacy hardware and return the generated signature", async () => {
    const APP_VERSION = "1.7.1";
    const SIGNATURE =
      "4gVuB1KsM58fb3vRpnDucwW4Vi6fVGA51QDQd9ARvx4GH5yYVDPzDnvzUbSJf3YLWWdsX7zCMSN9N1GMnTYwWiJf";

    const HEXADECIMAL_SIGNATURE =
      "3467567542314b734d35386662337652706e4475637757345669366656474135315144516439415276783447483579595644507a446e767a5562534a6633594c5757647358377a434d534e394e31474d6e54597757694a66";

    const getAppConfigurationMock = jest.fn(() => {
      return Promise.resolve({
        version: APP_VERSION,
        blindSigningEnabled: false,
        pubKeyDisplayMode: PubKeyDisplayMode.LONG,
      });
    });
    const signMessageMock = jest.fn((_deviceId, _messageHex) => {
      return Promise.resolve({ signature: Buffer.from(SIGNATURE) });
    });
    const solanaSigner: SolanaSigner = {
      getAppConfiguration: getAppConfigurationMock,
      getAddress: jest.fn(),
      signTransaction: jest.fn(),
      signMessage: signMessageMock,
    };

    const signerContext: SignerContext<SolanaSigner> = (_, fn) => fn(solanaSigner);
    const accountFreshAddressPath = "44'/501'/0'/0/0";
    const freshAddress = "8DpKDisipx6f76cEmuGvCX9TrA3SjeR76HaTRePxHBDe";
    const messageHex = "54657374696E67206F6E20536F6C616E61";
    const offchainMessage =
      "ff736f6c616e61206f6666636861696e0000220035343635373337343639364536373230364636453230353336463643363136453631";

    const result = await signMessage(signerContext)(
      "",
      { freshAddressPath: accountFreshAddressPath, freshAddress } as Account,
      { message: messageHex },
    );

    expect(result.signature).toEqual("0x" + HEXADECIMAL_SIGNATURE);
    expect(signMessageMock).toHaveBeenCalledTimes(1);
    expect(signMessageMock).toHaveBeenCalledWith(accountFreshAddressPath, offchainMessage);
  });

  it.each([{} as AnyMessage, {} as TypedEvmMessage])(
    "should throw an error when message options have not DefaultMessage type",
    async (messageOptions: AnyMessage) => {
      const signerContext: SignerContext<SolanaSigner> = (_, fn) =>
        fn({
          getAppConfiguration: jest.fn(),
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

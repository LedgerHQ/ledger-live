import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import { Account, AnyMessage, TypedEvmMessage } from "@ledgerhq/types-live";
import { LockedDeviceError, UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import bs58 from "bs58";
import coinConfig from "../../config";
import { signMessage } from "../../hw-signMessage";
import { PubKeyDisplayMode, SolanaSigner } from "../../signer";

coinConfig.setCoinConfig(() => ({
  legacyOCMSMaxVersion: "1.8.0",
  token2022Enabled: false,
  status: { type: "active" },
}));

describe("Testing call to hardware off-chain sign message on Solana", () => {
  it("should sign a message off-chain on hardware and return the generated signature", async () => {
    const APP_VERSION = "1.8.2";
    const SIGNATURE =
      "4gVuB1KsM58fb3vRpnDucwW4Vi6fVGA51QDQd9ARvx4GH5yYVDPzDnvzUbSJf3YLWWdsX7zCMSN9N1GMnTYwWiJf";

    const BASE58_SIGNATURE =
      "23mXB2pc8EQzc2mT3VJR4KkBFZaUVL9Pn7LUn8NMKeHKbS1hMj1QqGsUHHD3JMGhAWtFfcmnPhFSpPttChTNzsB9";
    const BASE58_ENVELOPE =
      "nHpqPBfv1CJUvmpaDaHp4hZZmoucL7f9qFkdwdQj1hFGbLWwWP5rBaBzh2kSFSNJSj5g8yC3Yo5TBHQMCE4ezkQthvpDMpcRvoLkYdwvvDZsqjt3AQnYGzV5fCCrZGnA1pecUUgczB4weoTSQmocrFX2dhqdZ39B71jwWShjn9pW3NY3DtvvMTug9vEkZW8b2GWPbaqoiXMZXAwGQXu4hVBYc8ScN1qV1BXHzX8FCPA";

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
      "ff736f6c616e61206f6666636861696e01016b4a46c53959cac0eff146ab323053cfc503321adfd453a7c67c91a24be0323535343635373337343639364536373230364636453230353336463643363136453631";

    const result = await signMessage(signerContext)(
      "",
      { freshAddressPath: accountFreshAddressPath, freshAddress } as Account,
      { message: messageHex },
    );

    expect(result.signature).toEqual(BASE58_ENVELOPE);
    expect(bs58.encode(bs58.decode(result.signature).subarray(1, 65))).toEqual(BASE58_SIGNATURE);
    expect(signMessageMock).toHaveBeenCalledTimes(1);
    expect(signMessageMock).toHaveBeenCalledWith(accountFreshAddressPath, offchainMessage);
  });

  it("should sign a message off-chain on legacy hardware and return the generated signature", async () => {
    const APP_VERSION = "1.7.1";
    const SIGNATURE =
      "4gVuB1KsM58fb3vRpnDucwW4Vi6fVGA51QDQd9ARvx4GH5yYVDPzDnvzUbSJf3YLWWdsX7zCMSN9N1GMnTYwWiJf";

    const BASE58_SIGNATURE =
      "23mXB2pc8EQzc2mT3VJR4KkBFZaUVL9Pn7LUn8NMKeHKbS1hMj1QqGsUHHD3JMGhAWtFfcmnPhFSpPttChTNzsB9";
    const BASE58_ENVELOPE =
      "tDAHsdMRLpSiAFbdWRS6d7TyG64QSwJFuRSHNH6UyjE8wQwDgawYRsUsau2n9s5drPkmDLTJdTrkA5uRYsHmmfzuMsBQvo6e72LwNjfNhmVko8ffmfM1ZNKZmyiurvDb2nfoFsLXmYTainNmRKwS6iGSBvWBYHRDMwUiX2z15gBokN2iMhuCvDsFHHVn7H4vQG";

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

    expect(result.signature).toEqual(BASE58_ENVELOPE);
    expect(bs58.encode(bs58.decode(result.signature).subarray(1, 65))).toEqual(BASE58_SIGNATURE);
    expect(signMessageMock).toHaveBeenCalledTimes(1);
    expect(signMessageMock).toHaveBeenCalledWith(accountFreshAddressPath, offchainMessage);
  });

  describe("non-legacy fallback sequencing", () => {
    const APP_VERSION = "1.8.2";
    const SIGNATURE =
      "4gVuB1KsM58fb3vRpnDucwW4Vi6fVGA51QDQd9ARvx4GH5yYVDPzDnvzUbSJf3YLWWdsX7zCMSN9N1GMnTYwWiJf";
    const accountFreshAddressPath = "44'/501'/0'/0/0";
    const freshAddress = "8DpKDisipx6f76cEmuGvCX9TrA3SjeR76HaTRePxHBDe";
    const messageHex = "54657374696E67206F6E20536F6C616E61";

    const V1_NO_LENGTH =
      "ff736f6c616e61206f6666636861696e01016b4a46c53959cac0eff146ab323053cfc503321adfd453a7c67c91a24be0323535343635373337343639364536373230364636453230353336463643363136453631";
    const V1_WITH_LENGTH =
      "ff736f6c616e61206f6666636861696e01016b4a46c53959cac0eff146ab323053cfc503321adfd453a7c67c91a24be03235220035343635373337343639364536373230364636453230353336463643363136453631";
    const V0 =
      "ff736f6c616e61206f6666636861696e00000000000000000000000000000000000000000000000000000000000000000000016b4a46c53959cac0eff146ab323053cfc503321adfd453a7c67c91a24be03235220035343635373337343639364536373230364636453230353336463643363136453631";

    function makeContext(signMessageMock: jest.Mock): SignerContext<SolanaSigner> {
      const signer: SolanaSigner = {
        getAppConfiguration: jest.fn(() =>
          Promise.resolve({
            version: APP_VERSION,
            blindSigningEnabled: false,
            pubKeyDisplayMode: PubKeyDisplayMode.LONG,
          }),
        ),
        getAddress: jest.fn(),
        signTransaction: jest.fn(),
        signMessage: signMessageMock,
      };
      return (_, fn) => fn(signer);
    }

    it("falls back from V1 no-length to V1 with-length on format rejection", async () => {
      const signMessageMock = jest
        .fn()
        .mockRejectedValueOnce(new Error("format not supported"))
        .mockResolvedValueOnce({ signature: Buffer.from(SIGNATURE) });

      await signMessage(makeContext(signMessageMock))(
        "",
        { freshAddressPath: accountFreshAddressPath, freshAddress } as Account,
        { message: messageHex },
      );

      expect(signMessageMock).toHaveBeenCalledTimes(2);
      expect(signMessageMock).toHaveBeenNthCalledWith(1, accountFreshAddressPath, V1_NO_LENGTH);
      expect(signMessageMock).toHaveBeenNthCalledWith(2, accountFreshAddressPath, V1_WITH_LENGTH);
    });

    it("falls back all the way to V0 when both V1 variants are rejected", async () => {
      const signMessageMock = jest
        .fn()
        .mockRejectedValueOnce(new Error("format not supported"))
        .mockRejectedValueOnce(new Error("format not supported"))
        .mockResolvedValueOnce({ signature: Buffer.from(SIGNATURE) });

      await signMessage(makeContext(signMessageMock))(
        "",
        { freshAddressPath: accountFreshAddressPath, freshAddress } as Account,
        { message: messageHex },
      );

      expect(signMessageMock).toHaveBeenCalledTimes(3);
      expect(signMessageMock).toHaveBeenNthCalledWith(1, accountFreshAddressPath, V1_NO_LENGTH);
      expect(signMessageMock).toHaveBeenNthCalledWith(2, accountFreshAddressPath, V1_WITH_LENGTH);
      expect(signMessageMock).toHaveBeenNthCalledWith(3, accountFreshAddressPath, V0);
    });

    it.each([
      ["UserRefusedOnDevice", new UserRefusedOnDevice()],
      ["LockedDeviceError", new LockedDeviceError()],
      ["TransportStatusError 0x6985 (user refused)", { statusCode: 0x6985 }],
      ["TransportStatusError 0x5515 (device locked)", { statusCode: 0x5515 }],
    ])("does not retry on %s", async (_label, error) => {
      const signMessageMock = jest.fn().mockRejectedValue(error);

      let caught: unknown;
      try {
        await signMessage(makeContext(signMessageMock))(
          "",
          { freshAddressPath: accountFreshAddressPath, freshAddress } as Account,
          { message: messageHex },
        );
      } catch (e) {
        caught = e;
      }

      expect(caught).toBe(error);
      expect(signMessageMock).toHaveBeenCalledTimes(1);
    });
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

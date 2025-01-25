import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { signMessage } from "./hw-signMessage";
import { BitcoinSigner } from "./signer";
import { createFixtureAccount } from "./__tests__/fixtures/common.fixtures";

describe("signMessage", () => {
  it("returns a base64 format string", async () => {
    const signerFake = {
      getWalletXpub: jest.fn(),
      getWalletPublicKey: jest.fn(),
      signMessage: jest.fn().mockResolvedValue({
        v: 1,
        r: "407c9da9dadf23a2d7e863f51aa3512fe3c86619f1d57b16e5d0659155e83888",
        s: "207c9da9dadf736839484733637aba12fe3c86619f1d57b16e5d0659155e8388",
      }),
      splitTransaction: jest.fn(),
      createPaymentTransaction: jest.fn(),
    };
    const signerContext = <T>(
      _deviceId: string,
      _crypto: CryptoCurrency,
      fn: (signer: BitcoinSigner) => Promise<T>,
    ): Promise<T> => fn(signerFake);

    const account = createFixtureAccount();

    const signature = await signMessage(signerContext)("deviceId", account, {
      message: "MESSAGE_TO_SIGN",
    });

    expect(signerFake.signMessage).toHaveBeenCalledTimes(1);
    expect(signature).toEqual({
      rsv: {
        v: 1,
        r: "407c9da9dadf23a2d7e863f51aa3512fe3c86619f1d57b16e5d0659155e83888",
        s: "207c9da9dadf736839484733637aba12fe3c86619f1d57b16e5d0659155e8388",
      },
      signature:
        "20407c9da9dadf23a2d7e863f51aa3512fe3c86619f1d57b16e5d0659155e83888207c9da9dadf736839484733637aba12fe3c86619f1d57b16e5d0659155e8388",
    });
  });
});

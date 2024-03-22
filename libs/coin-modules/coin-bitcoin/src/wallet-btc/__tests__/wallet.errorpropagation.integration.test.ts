import { DerivationModes } from "../types";
import BitcoinLikeWallet from "../wallet";
import { getSecp256k1Instance, setSecp256k1Instance } from "../crypto/secp256k1";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";

jest.setTimeout(180000);

describe("testing resilience of failures", () => {
  const wallet = new BitcoinLikeWallet();
  const defaultImpl = getSecp256k1Instance();
  it("should generate an account", async () => {
    setSecp256k1Instance({
      publicKeyTweakAdd: () => {
        throw new Error("FAILCRYPTO");
      },
    });
    try {
      await expect(
        wallet
          .generateAccount(
            {
              xpub: "xpub6CV2NfQJYxHn7MbSQjQip3JMjTZGUbeoKz5xqkBftSZZPc7ssVPdjKrgh6N8U1zoQDxtSo6jLarYAQahpd35SJoUKokfqf1DZgdJWZhSMqP",
              path: "44'/0'",
              index: 0,
              currency: "bitcoin",
              network: "mainnet",
              derivationMode: DerivationModes.LEGACY,
            },
            getCryptoCurrencyById("bitcoin"),
          )
          .then(a => wallet.syncAccount(a)),
      ).rejects.toEqual(new Error("FAILCRYPTO"));
    } finally {
      setSecp256k1Instance(defaultImpl);
    }
  });
});

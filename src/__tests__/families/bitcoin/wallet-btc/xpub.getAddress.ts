import { DerivationModes } from "../../../../families/bitcoin/wallet-btc";
import BitcoinLikeStorage from "../../../../families/bitcoin/wallet-btc/storage";
import BitcoinLikeExplorer from "../../../../families/bitcoin/wallet-btc/explorer";
import Xpub from "../../../../families/bitcoin/wallet-btc/xpub";
import coininfo from "coininfo";
import BCHCrypto from "../../../../families/bitcoin/wallet-btc/crypto/bitcoincash";
import BTCCrypto from "../../../../families/bitcoin/wallet-btc/crypto/bitcoin";
import ZECCrypto from "../../../../families/bitcoin/wallet-btc/crypto/zec";
import ZENCrypto from "../../../../families/bitcoin/wallet-btc/crypto/zen";

describe("Unit tests for getAddress", () => {
  it("Test getAddress for bch and btc", async () => {
    const bchCrypto = new BCHCrypto({
      network: coininfo.bitcoincash.main.toBitcoinJS(),
    });
    const btcCrypto = new BTCCrypto({
      network: coininfo.bitcoin.main.toBitcoinJS(),
    });
    const bchxpub = new Xpub({
      storage: new BitcoinLikeStorage(),
      explorer: new BitcoinLikeExplorer({
        explorerURI: "https://explorers.api.vault.ledger.com/blockchain/v3/bch",
        explorerVersion: "v3",
      }),
      crypto: bchCrypto,
      xpub: "xpub6BtWBf3Pu6hYwJBKvEwG7JtrTxxDrSGy39HaTgZz6GTSaFWFdoCtuEXSQtoKGaYdz1emg8xTXKYwjhu3xXRPzFnYS1z4yjKj7hLDQyNeDZr",
      derivationMode: DerivationModes.LEGACY,
    });
    await bchxpub.syncAddress(0, 0);
    let addresses = await bchxpub.getXpubAddresses();
    expect(addresses[0].address).toEqual(
      "bitcoincash:qrgwhfg7tn4xs9pg2vu5rhkud490j9yfnqd63uk64m"
    );

    const btcxpub = new Xpub({
      storage: new BitcoinLikeStorage(),
      explorer: new BitcoinLikeExplorer({
        explorerURI: "https://explorers.api.vault.ledger.com/blockchain/v3/btc",
        explorerVersion: "v3",
      }),
      crypto: btcCrypto,
      xpub: "xpub6BtWBf3Pu6hYwJBKvEwG7JtrTxxDrSGy39HaTgZz6GTSaFWFdoCtuEXSQtoKGaYdz1emg8xTXKYwjhu3xXRPzFnYS1z4yjKj7hLDQyNeDZr",
      derivationMode: DerivationModes.LEGACY,
    });
    await btcxpub.syncAddress(0, 0);
    addresses = await btcxpub.getXpubAddresses();
    expect(addresses[0].address).toEqual("1L3fqoWstvLqEA6TgXkuLoXX8xG1xhirG3");
  }, 60000);

  it("Test getoutputScriptFromAddress for btc, zcash and zen", async () => {
    const btcCrypto = new BTCCrypto({
      network: coininfo.bitcoin.main.toBitcoinJS(),
    });
    const zecCrypto = new ZECCrypto({
      network: coininfo.zcash.main.toBitcoinJS(),
    });
    const zenCrypto = new ZENCrypto({
      network: coininfo.zcash.main.toBitcoinJS(),
    });
    expect(
      btcCrypto
        .toOutputScript("1F1tAaz5x1HUXrCNLbtMDqcw6o5GNn4xqX")
        .toString("hex")
    ).toEqual("76a91499bc78ba577a95a11f1a344d4d2ae55f2f857b9888ac");
    expect(
      zecCrypto
        .toOutputScript("t1T5XJvzQhh2gTsi3c5Vn9x5SMhpSWLSnVy")
        .toString("hex")
    ).toEqual("76a91464fa33fb6f8d72455af2a4e73ae30412af2c97ba88ac");
    expect(
      zenCrypto
        .toOutputScript("znjbHth4PxBJM8FmHgvXYHkuq99nKFkWvMg")
        .toString("hex")
    ).toEqual(
      "76a914cb009bf12fc17d28e61527951101fdabfeaa187288ac209ec9845acb02fab24e1c0368b3b517c1a4488fba97f0e3459ac053ea0100000003c01f02b4"
    );
  }, 30000);
});

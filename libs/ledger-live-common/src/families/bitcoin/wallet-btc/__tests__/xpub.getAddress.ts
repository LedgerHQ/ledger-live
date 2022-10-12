import { DerivationModes } from "../";
import BitcoinLikeStorage from "../storage";
import BitcoinLikeExplorer from "../explorer";
import Xpub from "../xpub";
import coininfo from "coininfo";
import BCHCrypto from "../crypto/bitcoincash";
import BTCCrypto from "../crypto/bitcoin";
import ZECCrypto from "../crypto/zec";
import ZENCrypto from "../crypto/zen";

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
    // Legacy zcash address
    expect(
      zecCrypto
        .toOutputScript("t1T5XJvzQhh2gTsi3c5Vn9x5SMhpSWLSnVy")
        .toString("hex")
    ).toEqual("76a91464fa33fb6f8d72455af2a4e73ae30412af2c97ba88ac");
    // P2SH zcash address
    expect(
      zecCrypto
        .toOutputScript("t3PU1j7YW3fJ67jUbkGhSRto8qK2qXCUiW3")
        .toString("hex")
    ).toEqual("a91435c929cb2ee32626e1f5c8d773ab4fe9d94686e087");
    // Legacy zen address
    expect(
      zenCrypto
        .toOutputScript("znjbHth4PxBJM8FmHgvXYHkuq99nKFkWvMg")
        .toString("hex")
    ).toEqual(
      "76a914cb009bf12fc17d28e61527951101fdabfeaa187288ac209ec9845acb02fab24e1c0368b3b517c1a4488fba97f0e3459ac053ea0100000003c01f02b4"
    );
    // P2SH zen address
    expect(
      zenCrypto
        .toOutputScript("zszpcLB6C5B8QvfDbF2dYWXsrpac5DL9WRk")
        .toString("hex")
    ).toEqual(
      "a914df23c5eaba30b4d95798c5d5d0e2ecc2a3dc4ff287209ec9845acb02fab24e1c0368b3b517c1a4488fba97f0e3459ac053ea0100000003c01f02b4"
    );
  }, 30000);
  it.skip("Get legacy address benchmark", async () => {
    const btcCrypto = new BTCCrypto({
      network: coininfo.bitcoin.main.toBitcoinJS(),
    });
    for (let i = 0; i < 1; i++) {
      for (let j = 0; j < 1000; j++) {
        btcCrypto.getAddress(
          DerivationModes.LEGACY,
          "xpub6CThYZbX4PTeA7KRYZ8YXP3F6HwT2eVKPQap3Avieds3p1eos35UzSsJtTbJ3vQ8d3fjRwk4bCEz4m4H6mkFW49q29ZZ6gS8tvahs4WCZ9X",
          i,
          j
        );
      }
    }
  }, 30000);
  it.skip("Get taproot address benchmark", async () => {
    const btcCrypto = new BTCCrypto({
      network: coininfo.bitcoin.main.toBitcoinJS(),
    });
    for (let i = 0; i < 1; i++) {
      for (let j = 0; j < 1000; j++) {
        btcCrypto.getAddress(
          DerivationModes.TAPROOT,
          "xpub6CThYZbX4PTeA7KRYZ8YXP3F6HwT2eVKPQap3Avieds3p1eos35UzSsJtTbJ3vQ8d3fjRwk4bCEz4m4H6mkFW49q29ZZ6gS8tvahs4WCZ9X",
          i,
          j
        );
      }
    }
  }, 30000);
});

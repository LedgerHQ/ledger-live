import coininfo from "coininfo";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";

import { DerivationModes } from "..";
import BitcoinLikeStorage from "../storage";
import BitcoinLikeExplorer from "../explorer";
import Xpub from "../xpub";
import BCHCrypto from "../crypto/bitcoincash";
import BTCCrypto from "../crypto/bitcoin";

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
        cryptoCurrency: getCryptoCurrencyById("bitcoin_cash"),
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
        cryptoCurrency: getCryptoCurrencyById("bitcoin"),
      }),
      crypto: btcCrypto,
      xpub: "xpub6BtWBf3Pu6hYwJBKvEwG7JtrTxxDrSGy39HaTgZz6GTSaFWFdoCtuEXSQtoKGaYdz1emg8xTXKYwjhu3xXRPzFnYS1z4yjKj7hLDQyNeDZr",
      derivationMode: DerivationModes.LEGACY,
    });
    await btcxpub.syncAddress(0, 0);
    addresses = await btcxpub.getXpubAddresses();
    expect(addresses[0].address).toEqual("1L3fqoWstvLqEA6TgXkuLoXX8xG1xhirG3");
  }, 60000);

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

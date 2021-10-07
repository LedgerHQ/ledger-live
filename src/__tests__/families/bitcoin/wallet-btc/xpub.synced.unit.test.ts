// import path from 'path';
// import fs from 'fs';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import coininfo from "coininfo";
import { zipObject } from "lodash";
import { DerivationModes } from "../../../../families/bitcoin/wallet-btc/types";
import BitcoinLikeStorage from "../../../../families/bitcoin/wallet-btc/storage";
import BitcoinLikeExplorer from "../../../../families/bitcoin/wallet-btc/explorer";
import Crypto from "../../../../families/bitcoin/wallet-btc/crypto/bitcoin";
import Xpub from "../../../../families/bitcoin/wallet-btc/xpub";

describe("synced xpub utilites functions", () => {
  const explorer = new BitcoinLikeExplorer({
    explorerURI: "https://explorers.api.vault.ledger.com/blockchain/v3/btc",
    explorerVersion: "v3",
  });
  const crypto = new Crypto({
    network: coininfo.bitcoin.main.toBitcoinJS(),
  });

  describe("xpub xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egpiMZbpiaQL2jkwSB1icqYh2cfDfVxdx4df189oLKnC5fSwqPfgyP3hooxujYzAu3fDVmz Legacy", () => {
    const xpubraw =
      "xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egpiMZbpiaQL2jkwSB1icqYh2cfDfVxdx4df189oLKnC5fSwqPfgyP3hooxujYzAu3fDVmz";
    // const truthDump = path.join(__dirname, 'data', 'sync', `${xpubraw}.json`);
    const storage = new BitcoinLikeStorage();
    const xpub = new Xpub({
      storage,
      explorer,
      crypto,
      xpub: xpubraw,
      derivationMode: DerivationModes.LEGACY,
    });

    beforeAll(async () => {
      await xpub.sync();
    }, 30000);

    it("should compute accounts/addresses/balances correctly", async () => {
      const addresses = await xpub.getXpubAddresses();
      expect(addresses.length).toEqual(15);

      expect((await xpub.getAccountAddresses(0)).length).toEqual(15);

      expect((await xpub.getXpubBalance()).toNumber()).toEqual(12688908);
      expect((await xpub.getAccountBalance(0)).toNumber()).toEqual(12688908);
      const addressesBalances = await Promise.all(
        addresses.map((address) => xpub.getAddressBalance(address))
      );
      expect(
        zipObject(
          addresses.map((address) => address.address),
          addressesBalances.map((balance) => balance.toNumber())
        )
      ).toEqual({
        "12iNxzdF6KFZ14UyRTYCRuptxkKSSVHzqF": 0,
        "15NvG6YpVh2aUc3DroVttEcWa1Z99qhACP": 1000,
        "15xANZb5vJv5RGL263NFuh8UGgHT7noXeZ": 100000,
        "1687EJf5YEmeEtcscnuJPiV5b8HkM1o98q": 40160,
        "16HH35ASv5rL8ZaaqdzvrJKTAKTucdKKNP": 656,
        "16ZBYSHkLkRFHAuZvyzosXYgU1UDJxRV1R": 100000,
        "1Ahipz531XtbzGC1bEKbhHZXmyfWKPNy32": 1000,
        "1CcEugXu9Yf9Qw5cpB8gHUK4X9683WyghM": 8747,
        "1EHeVKfjjq6FJpix86G2yzFeRbZ6RNg2Zm": 100000,
        "1EfgV2Hr5CDjXPavHDpDMjmU33BA2veHy6": 10665,
        "1HqsYkwczwvkMXCobk5WPZmhj2S2TK613Z": 40161,
        "1KhVznhEQHumfmMQWnkgXLT4BmvtNpwLN9": 12183719,
        "1LDPJCMZhYZjTvTGYahdhMXLuMfjfi6Kua": 1000,
        "1MS6eGqD4iUGyJPbEsjqmoNaRhApgtmF8J": 1800,
        "1PJMBXKBYEBMRDmpAoBRbDff26gHJrawSp": 100000,
      });
    });
  });
});

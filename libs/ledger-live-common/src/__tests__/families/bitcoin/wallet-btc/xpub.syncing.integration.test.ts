/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import coininfo from "coininfo";
import { toMatchFile } from "jest-file-snapshot";
import { DerivationModes } from "../../../../families/bitcoin/wallet-btc/types";
import BitcoinLikeStorage from "../../../../families/bitcoin/wallet-btc/storage";
import BitcoinLikeExplorer from "../../../../families/bitcoin/wallet-btc/explorer";
import Xpub from "../../../../families/bitcoin/wallet-btc/xpub";
import * as currency from "../../../../families/bitcoin/wallet-btc/crypto";

expect.extend({ toMatchFile });
describe("xpub integration sync", () => {
  const walletDatasets = [
    {
      xpub: "xpub6CMtoA66sLkbsZo8RNq7PoKz19WdThkSxNzwz8MgyjhsPjVwjFqXqb69xyRVGs2iSd98yDrVL4A6tC2vsTsgQDPXFa46AvPoh5PWhppNdoV",
      derivationMode: DerivationModes.SEGWIT,
      addresses: 46,
      balance: 308018,
      network: coininfo["bitcoin gold"].main.toBitcoinJS(),
      coin: "btg",
      explorerVersion: "v3",
    },
    {
      xpub: "tpubDCYcGoj35gRcahvoxni1TTEaSgbqWXtqG6HvFWoXbXC2fbw2mprWwyKzvgv4WY4pBs8SL9wZzQYZ8bX9ecKQ91C5eTnsGuVEBKnborrKhUH",
      derivationMode: DerivationModes.SEGWIT,
      addresses: 7,
      balance: 375496,
      network: coininfo.bitcoin.test.toBitcoinJS(),
      coin: "btc_testnet",
      explorerVersion: "v3",
    },
    {
      xpub: "xpub6Bn7mxuS3VxCqofYcGaZDm2iAfSoGN9bY5LA2QG69BWaMtS4F58WgAYJhhUBjcwJJpLNtMB6i15J7gwBot6rNouLuuBEsA9uHxFAhQcD1M2",
      derivationMode: DerivationModes.SEGWIT,
      addresses: 38,
      balance: 403178204,
      network: coininfo.digibyte.main.toBitcoinJS(),
      coin: "dgb",
      explorerVersion: "v3",
    },
    {
      xpub: "xpub6C3xxFdpsuBPQegeJHvf1G6YMRkay4YJCERUmsWW3DbfcREPeEbcML7nmk79AMgcCu1YkC5CA2s1TZ5ubmVsWuEr7N97X6z2vtrpRzvQbhG",
      derivationMode: DerivationModes.NATIVE_SEGWIT,
      addresses: 52,
      balance: 80711645,
      network: coininfo.digibyte.main.toBitcoinJS(),
      coin: "dgb",
      explorerVersion: "v3",
    },
    /*
    {
      xpub: "xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egpiMZbpiaQL2jkwSB1icqYh2cfDfVxdx4df189oLKnC5fSwqPfgyP3hooxujYzAu3fDVmz", // 3000ms
      derivationMode: DerivationModes.LEGACY,
      addresses: 15,
      balance: 12688908,
      network: coininfo.bitcoin.main.toBitcoinJS(),
      coin: "btc",
      explorerVersion: "v3",
    },
    */
    {
      xpub: "xpub6D4waFVPfPCpRvPkQd9A6n65z3hTp6TvkjnBHG5j2MCKytMuadKgfTUHqwRH77GQqCKTTsUXSZzGYxMGpWpJBdYAYVH75x7yMnwJvra1BUJ", // 5400ms
      derivationMode: DerivationModes.LEGACY,
      addresses: 506,
      balance: 166505122,
      network: coininfo.bitcoin.main.toBitcoinJS(),
      coin: "btc",
      explorerVersion: "v3",
    },
    {
      xpub: "xpub6BvNdfGcyMB9Usq88ibXUt3KhbaEJVLFMbhTSNNfTm8Qf1sX9inTv3xL6pA6KofW4WF9GpdxwGDoYRwRDjHEir3Av23m2wHb7AqhxJ9ohE8",
      addresses: 16,
      balance: 360615,
      network: coininfo.bitcoincash.main.toBitcoinJS(),
      derivationMode: DerivationModes.LEGACY,
      coin: "bch",
      explorerVersion: "v3",
    },
    /*
    {
      xpub: "xpub6CThYZbX4PTeA7KRYZ8YXP3F6HwT2eVKPQap3Avieds3p1eos35UzSsJtTbJ3vQ8d3fjRwk4bCEz4m4H6mkFW49q29ZZ6gS8tvahs4WCZ9X", // 138sec,
      derivationMode: DerivationModes.LEGACY,
      addresses: 9741,
      balance: 0,
      network: coininfo.bitcoin.main.toBitcoinJS(),
      coin: "btc",
      explorerVersion: "v3",
    },
    */
    {
      xpub: "Ltub2ZgHGhWdGi2jacCdKEy3qddYxH4bpDtmueiPWkG8267Z9K8yQEExapyNi1y4Qp7f79JN8468uE9V3nizpPU27WEDfXrtqpkp84MyhhCDTNk",
      addresses: 5,
      balance: 87756,
      network: coininfo.litecoin.main.toBitcoinJS(),
      derivationMode: DerivationModes.LEGACY,
      coin: "ltc",
      explorerVersion: "v3",
    },
    {
      xpub: "xpub6DWu8baXZKRb3FbLebkpXq2qm1hH4N9F8hzTBoZAWrPNBAXgCSK8qqfsc38gaCEFZWUS9rJHMgE3DS4rh7Qqn47PHKHYkMzWXfo39cYdwVJ",
      derivationMode: DerivationModes.LEGACY,
      addresses: 25,
      balance: 591574,
      network: coininfo.zcash.main.toBitcoinJS(),
      coin: "zec",
      explorerVersion: "v3",
    },
    {
      xpub: "dgub8rLBz9DzvDxQTL2JqCcwRwzdz53mYZFNim9pPNM2np5BRFaoFfsV13wkhC43ENdSXYgc2tRvztLmtW7jDjArjaqsU1xJDKAwNLpJax9c38h",
      derivationMode: DerivationModes.LEGACY,
      addresses: 1,
      balance: 1000000000,
      network: coininfo.dogecoin.main.toBitcoinJS(),
      coin: "doge",
      explorerVersion: "v3",
    },
    {
      xpub: "drkvjQazgLR4pZpN8qJ3jVS9rAcQardiFVmmTb3K4qFvMTJaPH8hnrhZiXJwK8nKNrkfWxBAy7R2QkDKNJih1h1KyYkS8PyEYfeB4zcbReY9nrc",
      derivationMode: DerivationModes.LEGACY,
      addresses: 1,
      balance: 771859,
      network: coininfo.dash.main.toBitcoinJS(),
      coin: "dash",
      explorerVersion: "v3",
    },
    {
      xpub: "xpub6BkvrczwoUfLGaNPQFdWXaNFCLzojvw7jFqmKPffS3up21H9uWvo6PcBsQn151ZaffZnyMSZahKfHJSGu7bUViQYDGw3YaEHTM7AjqPhqXC",
      derivationMode: DerivationModes.LEGACY,
      addresses: 1,
      balance: 9336036,
      network: coininfo.zcash.main.toBitcoinJS(),
      coin: "zen",
      explorerVersion: "v3",
    },
    {
      xpub: "xpub6DMytGS7yNiSgVgexAQnyStpPcaLTXfZ8CVCX65DmsyJctLxem4ez1b2HrAtXviiDcp8Bjc9TKsZ8ewfsYPQGiEo7oUEDVd7YEXo5xQru1t",
      derivationMode: DerivationModes.LEGACY,
      addresses: 1,
      balance: 20000000,
      network: coininfo.vertcoin.main.toBitcoinJS(),
      coin: "vtc",
      explorerVersion: "v3",
    },
    {
      xpub: "xpub6DFFkxo83nYyF7ZHsZYRhDLa6GSK2rtaAZHR66H2YTzBkgBPy6yK5VCD4YVCSUjd1sFe18d17rGveeuSJ2Prn7k9wcwn3BWuZpSE48yThEE",
      derivationMode: DerivationModes.LEGACY,
      addresses: 1,
      balance: 754825,
      network: coininfo.qtum.main.toBitcoinJS(),
      coin: "qtum",
      explorerVersion: "v3",
    },
    {
      xpub: "r29uBq4rq2uXchKovN9vruP4WSNj5Kjzk7e8cHBnvnSnPJo5fpxNdqxkMfVXsjuqzBj5s8L8Fa2AdVctX16FDP4oqPLA1GXZRCAyjshXpp2czfJ2",
      derivationMode: DerivationModes.LEGACY,
      addresses: 1,
      balance: 109660,
      network: coininfo.peercoin.main.toBitcoinJS(),
      coin: "ppc",
      explorerVersion: "v3",
    },
    {
      xpub: "xpub6DAJ5UZx3jbDDoiZq3t6doR3WV6XvWtsfrbPak49Pc4xapooCAEkn77vEkJVsXmvVGBNmFoCDQ73aRuMRZo2uYuyBjVxJTvC9NZKrK3LzHc",
      derivationMode: DerivationModes.LEGACY,
      addresses: 1,
      balance: 200000000,
      network: coininfo.viacoin.main.toBitcoinJS(),
      coin: "via",
      explorerVersion: "v3",
    },
    {
      xpub: "xpub6Bhj2H9zg68KeE7hVg8KmoNqWev9vXKnsM3mVUhxVKN5QdNAtDjvWBGUJmMhxoPAhobfafg5Uux6xLcD2gpKKQdxot2T2jWpLUS3mhZruim",
      derivationMode: DerivationModes.LEGACY,
      addresses: 1,
      balance: 100000000,
      network: coininfo.bitcoin.main.toBitcoinJS(),
      coin: "xsn",
      explorerVersion: "v3",
    },
    {
      xpub: "v4PKUB8jAMVY8DsF9CrC5pT4kn1rsHtJY1ehtLSMemakWdMHHwdF5tsQXqQWov93ngSX1GUc1y7x91obdRtu9Bpyk3vqMWKnU9QLpYEjuVqLJy9T",
      derivationMode: DerivationModes.LEGACY,
      addresses: 1,
      balance: 200000000,
      network: coininfo.bitcoin.main.toBitcoinJS(),
      coin: "kmd",
      explorerVersion: "v3",
    },
    {
      xpub: "ToEA6kVVodfRW2DuuMjPPMsLLukY4EsScxdHYJkTtdopPD5Z5t9gpB2zEwpschy7rFzTqxQCXQFUBnxT5MAnfkNT4dkWqtHPE2L7bG7GC24XnLy",
      derivationMode: DerivationModes.LEGACY,
      addresses: 1,
      balance: 400000000,
      network: coininfo.bitcoin.main.toBitcoinJS(),
      coin: "pivx",
      explorerVersion: "v3",
    },
    {
      xpub: "dpubZFUiMExUREbqJQVJkfXSs4wjUb1jwVkoofnPK8Mt95j3PanCyq9Mc4aFnWtRZkhci9ZYPVLZybVLMMkS6g1nKBTN4899KJwGeVBvyumvcjW",
      derivationMode: DerivationModes.LEGACY,
      addresses: 6,
      balance: 0,
      network: coininfo.decred.main.toBitcoinJS(),
      coin: "dcr",
      explorerVersion: "v3",
    },
  ];

  walletDatasets.forEach((dataset) =>
    describe(`xpub ${dataset.xpub} ${dataset.derivationMode}`, () => {
      if (
        dataset.explorerVersion !== "v2" &&
        dataset.explorerVersion !== "v3"
      ) {
        throw new Error("wrong explorer version");
      }
      const storage = new BitcoinLikeStorage();
      let crypto;
      switch (dataset.coin) {
        case "btc":
          crypto = new currency.Bitcoin({ network: dataset.network });
          break;
        case "bch":
          crypto = new currency.BitcoinCash({ network: dataset.network });
          break;
        case "ltc":
          crypto = new currency.Litecoin({ network: dataset.network });
          break;
        case "btc_testnet":
          crypto = new currency.Bitcoin({ network: dataset.network });
          break;
        case "btg": // bitcoin gold
          crypto = new currency.BitcoinGold({ network: dataset.network });
          break;
        case "dgb": // digibyte
          crypto = new currency.Digibyte({ network: dataset.network });
          break;
        case "dash":
          crypto = new currency.Dash({ network: dataset.network });
          break;
        case "doge": // dogecoin
          crypto = new currency.Doge({ network: dataset.network });
          break;
        case "kmd": // komodo
          crypto = new currency.Komodo({ network: dataset.network });
          break;
        case "pivx":
          crypto = new currency.Pivx({ network: dataset.network });
          break;
        case "xsn": // stakenet
          crypto = new currency.Stakenet({ network: dataset.network });
          break;
        case "xst": // stealthcoin
          crypto = new currency.Stealth({ network: dataset.network });
          break;
        case "ppc": // peercoin
          crypto = new currency.Peercoin({ network: dataset.network });
          break;
        case "qtum":
          crypto = new currency.Qtum({ network: dataset.network });
          break;
        case "vtc": // vertcoin
          crypto = new currency.Vertcoin({ network: dataset.network });
          break;
        case "via": // viacoin
          crypto = new currency.ViaCoin({ network: dataset.network });
          break;
        case "zec": // zcash
          crypto = new currency.Zec({ network: dataset.network });
          break;
        case "zen": // zencash
          crypto = new currency.Zen({ network: dataset.network });
          break;
        case "dcr": // decred
          crypto = new currency.Decred({ network: dataset.network });
          break;
        default:
          throw new Error("Should not be reachable");
      }
      const explorer = new BitcoinLikeExplorer({
        explorerURI: `https://explorers.api.vault.ledger.com/blockchain/${dataset.explorerVersion}/${dataset.coin}`,
        explorerVersion: dataset.explorerVersion,
      });
      const xpub = new Xpub({
        storage,
        explorer,
        crypto,
        xpub: dataset.xpub,
        derivationMode: dataset.derivationMode,
      });

      it(
        "should sync from zero correctly",
        async () => {
          await xpub.sync();
          // const truthDump = path.join(__dirname, 'data', 'sync', `${dataset.xpub}.json`);
          // const data = await storage.export();
          // data.txs = orderBy(data.txs, ['derivationMode', 'account', 'index', 'block.height', 'id']);
          // expect(JSON.stringify(txs, null, 2)).toMatchFile(truthDump);
          expect((await xpub.getXpubBalance()).toNumber()).toEqual(
            dataset.balance
          );
          const addresses = await xpub.getXpubAddresses();
          expect(addresses.length).toEqual(dataset.addresses);
        },
        // github so slow
        15 * 60 * 1000
      );
    })
  );
});

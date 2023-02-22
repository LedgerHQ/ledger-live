// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import coininfo from "coininfo";
import { zipObject } from "lodash";
import { DerivationModes } from "../types";
import BitcoinLikeStorage from "../storage";
import BitcoinLikeExplorer from "../explorer";
import Crypto from "../crypto/bitcoincash";
import Xpub from "../xpub";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";

describe("synced xpub utilites functions", () => {
  const explorer = new BitcoinLikeExplorer({
    cryptoCurrency: getCryptoCurrencyById("bitcoin_cash"),
  });
  const crypto = new Crypto({
    network: coininfo.bitcoincash.main.toBitcoinJS(),
  });

  describe("xpub xpub6BvNdfGcyMB9Usq88ibXUt3KhbaEJVLFMbhTSNNfTm8Qf1sX9inTv3xL6pA6KofW4WF9GpdxwGDoYRwRDjHEir3Av23m2wHb7AqhxJ9ohE8 Legacy", () => {
    const xpubraw =
      "xpub6BvNdfGcyMB9Usq88ibXUt3KhbaEJVLFMbhTSNNfTm8Qf1sX9inTv3xL6pA6KofW4WF9GpdxwGDoYRwRDjHEir3Av23m2wHb7AqhxJ9ohE8";
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
    }, 120000);

    it("should compute accounts/addresses/balances correctly", async () => {
      const addresses = await xpub.getXpubAddresses();
      expect(addresses.length).toEqual(16);

      expect((await xpub.getAccountAddresses(0)).length).toEqual(7);

      expect((await xpub.getXpubBalance()).toNumber()).toEqual(360615);
      expect((await xpub.getAccountBalance(0)).toNumber()).toEqual(10000);
      const addressesBalances = await Promise.all(
        addresses.map((address) => xpub.getAddressBalance(address))
      );
      expect(
        zipObject(
          addresses.map((address) => address.address),
          addressesBalances.map((balance) => balance.toNumber())
        )
      ).toEqual({
        "bitcoincash:qp2ujnlxjmkwtc299zwat3vt7j0jgltwls3q5avzsj": 0,
        "bitcoincash:qp62d8j6ng0jhenc97dnnyn6qev24vykev5pea7jd3": 0,
        "bitcoincash:qp64rlh8jf82kxsvh2rhjr8wnltt3vu5ccna7zygun": 0,
        "bitcoincash:qpguw9mwet4aamye4texdrvje5wj7twhss5agzwzwa": 0,
        "bitcoincash:qpvezzthl2075alur9y53tqsqcm3z8t4rgq6vcalun": 0,
        "bitcoincash:qq3ch5aymjxvlt2q646gxtnrqeq45h269yt7l2yl0k": 350615,
        "bitcoincash:qq6u57s2nc5zuywmwrw9tnkjvvw5rzs40vk6q5jjaz": 10000,
        "bitcoincash:qqk8v7daqpl2fe4qezw5uzhueqxrj9eahvnhz2v39e": 0,
        "bitcoincash:qqu0nek90hahl0sezqz8cf8yc7hmqvgseykqyp3awm": 0,
        "bitcoincash:qqufmrqunkr3avkswhn378fjhwl3ueawag9e3htc49": 0,
        "bitcoincash:qrkmvwx8y4lprh8xzz0fhnrmqpqvpssqnqle8lds8k": 0,
        "bitcoincash:qzadqth7znrc7e5s5p40kadpu4lj9lkahvja522rh2": 0,
        "bitcoincash:qzgah58nthe50jau20y67s4zq9u0xqvxeyqrv2aewk": 0,
        "bitcoincash:qzj2q6yrxmxedffsz2rvpy067pcdvwhy9gcyhsne48": 0,
        "bitcoincash:qzjgtadhd6j96a9mvlt5cj2ewgljyjzrlq4nplva5l": 0,
        "bitcoincash:qzmwszdjh6h9crvk65zlravhal50rnwtfu6pacsdsn": 0,
      });
    });
  });
});

import coininfo from "coininfo";
import BigNumber from "bignumber.js";
import { DerivationModes } from "../types";
import Xpub from "../xpub";
import Doge from "../crypto/doge";
import BitcoinLikeExplorer from "../explorer";
import BitcoinLikeStorage from "../storage";
import { Merge } from "../pickingstrategies/Merge";
import BitcoinLikeWallet from "../wallet";
import MockBtc from "../../mockBtc";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";

describe("testing dogecoin transactions", () => {
  const wallet = new BitcoinLikeWallet();
  const explorer = new BitcoinLikeExplorer({
    cryptoCurrency: getCryptoCurrencyById("dogecoin"),
  });

  const network = coininfo.dogecoin.main.toBitcoinJS();
  const crypto = new Doge({ network });

  const storage = new BitcoinLikeStorage();
  const xpub = new Xpub({
    storage,
    explorer,
    crypto,
    xpub: "dgub8rBf7BYsf5YoMezYuPaEhc2tsr7sQA2v2xNCj4mt1czF1m4hRiBdjYeAq5xDVQhN5HqYQnxv2DwyfmDvp1QEfmi44b8uynPL45KXQJrsoi8",
    derivationMode: DerivationModes.LEGACY,
  });
  it("testing dogecoin transactions with huge amount", async () => {
    const utxoPickingStrategy = new Merge(xpub.crypto, xpub.derivationMode, []);
    const changeAddress = await xpub.getNewAddress(1, 0);
    xpub.storage.appendTxs([
      {
        id: "c4ee70c30b9c5c5fed60c37ce86046156af3623f32aa5be94556b35dcf0af147",
        inputs: [],
        outputs: [
          {
            output_index: 0,
            value: "500000000000000000", // huge utxo
            address: "mwXTtHo8Yy3aNKUUZLkBDrTcKT9qG9TqLb",
            output_hash:
              "c4ee70c30b9c5c5fed60c37ce86046156af3623f32aa5be94556b35dcf0af147",
            block_height: 1,
            rbf: false,
          },
          {
            output_index: 1,
            value: "0",
            address: "<unknown>",
            output_hash:
              "c4ee70c30b9c5c5fed60c37ce86046156af3623f32aa5be94556b35dcf0af147",
            block_height: 1,
            rbf: false,
          },
        ],
        block: {
          hash: "73c565a6f226978df23480e440b27eb02f307855f50aa3bc72ebb586938f23e0",
          height: 1,
          time: "2021-07-28T13:34:17Z",
        },
        account: 0,
        index: 0,
        address: "mwXTtHo8Yy3aNKUUZLkBDrTcKT9qG9TqLb",
        received_at: "2021-07-28T13:34:17Z",
      },
    ]);

    const txInfo = await xpub.buildTx({
      destAddress: "D9fSjc6zAyjdRgSfbfMLv5z5FpuacvguUi",
      amount: new BigNumber(200000000000000000),
      feePerByte: 100,
      changeAddress,
      utxoPickingStrategy,
      sequence: 0,
    });
    const account = await wallet.generateAccount(
      {
        xpub: xpub.xpub,
        path: "44'/0'",
        index: 0,
        currency: "dogecoin",
        network: "mainnet",
        derivationMode: DerivationModes.LEGACY,
      },
      getCryptoCurrencyById("dogecoin")
    );
    await wallet.signAccountTx({
      btc: new MockBtc(),
      fromAccount: account,
      txInfo,
    });
  }, 100000);
});

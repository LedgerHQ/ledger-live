import coininfo from "coininfo";
import BigNumber from "bignumber.js";
import { DerivationModes } from "../types";
import Xpub from "../xpub";
import BitcoinLikeExplorer from "../explorer";
import BitcoinLikeStorage from "../storage";
import { Merge } from "../pickingstrategies/Merge";
import BitcoinLikeWallet from "../wallet";
import MockBtcSigner from "../../mockBtcSigner";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import ZCash from "../crypto/zec";

describe("testing zcash transactions", () => {
  const wallet = new BitcoinLikeWallet();
  const explorer = new BitcoinLikeExplorer({
    cryptoCurrency: getCryptoCurrencyById("zcash"),
  });

  const network = coininfo.zcash.main.toBitcoinJS();
  const crypto = new ZCash({ network });

  const storage = new BitcoinLikeStorage();
  const xpub = new Xpub({
    storage,
    explorer,
    crypto,
    xpub: "xpub6CkCmmUPLcfa5ok52mSD8LdqxY7ixWLVuVruLLxmQHdefjJx6DtJdXdp8TDXMrfHYB4mybYYaFxMbDW2MzuZgudpNW44KRhyzAog5kd1Tda",
    derivationMode: DerivationModes.LEGACY,
  });
  it("testing zcash transactions created with proper blockheight info being passed", async () => {
    const utxoPickingStrategy = new Merge(xpub.crypto, xpub.derivationMode, []);
    const changeAddress = await xpub.getNewAddress(1, 0);
    const OUTPUT_VALUE_1 = 1_000_000;
    const OUTPUT_VALUE_2 = 2_000_000;
    xpub.storage.appendTxs([
      {
        id: "fca8f0b145a04e8cd1286dba61f7ad8bee389d12a70a0137aa4af6d1cb7efbb8",
        received_at: "2024-12-04T08:31:06Z",
        fees: 226226,
        inputs: [
          {
            output_hash: "34a59cc1fc6dc9b5a6c4ec0c3640fed91baf90eede0ed3f7e1bcd1299e14aab5",
            output_index: 1,
            value: "40638286",
            address: "t1eQ9NKV1rLx7DyehHVKDDMX5TqNdg5A2jZ",
            sequence: 0,
          },
        ],
        outputs: [
          {
            output_index: 0,
            value: `${OUTPUT_VALUE_1}`,
            address: "t1UevC8vTmRDTMzntzp8XG9An114ToGQu6w",
            output_hash: "fca8f0b145a04e8cd1286dba61f7ad8bee389d12a70a0137aa4af6d1cb7efbb8",
            block_height: 2738883,
            rbf: true,
          },
          {
            output_index: 1,
            value: "40312060",
            address: "t1fGmLoo3AuQYU7kytozzcLmTa7q2978Efw",
            output_hash: "fca8f0b145a04e8cd1286dba61f7ad8bee389d12a70a0137aa4af6d1cb7efbb8",
            block_height: 2738883,
            rbf: true,
          },
        ],
        block: {
          hash: "00000000011e5982320559c1beb83d3a307f5229cf09d2cf6d7a803e0dae1860",
          height: 2738883,
          time: "2024-12-04T08:31:06Z",
        },
        account: 0,
        index: 8,
        address: "t1UevC8vTmRDTMzntzp8XG9An114ToGQu6w",
      },

      {
        id: "db9e8290e1f6ecd7159e122419918f14be2047c5493de0e46f52d63107aa9c98",
        received_at: "2022-09-12T11:37:00Z",
        fees: 2486,
        inputs: [
          {
            output_hash: "f4278db5c11680306d4f1b40568055ea286f50eda4e75e20ab7a2967a4f1731d",
            output_index: 1,
            value: "46382915",
            address: "t1SCkDS3BayQG6SfxG9H1DP8KqzJhswget9",
            sequence: 0,
          },
        ],
        outputs: [
          {
            output_index: 0,
            value: "46330429",
            address: "t1e8XpYgHoHs4VSrariNknegHhYzNAZ6F5h",
            // "spent_at_height": null,
            output_hash: "db9e8290e1f6ecd7159e122419918f14be2047c5493de0e46f52d63107aa9c98",
            block_height: 1806010,
            rbf: true,
          },
          {
            output_index: 1,
            value: `${OUTPUT_VALUE_2}`,
            address: "t1grLcTkpVUjULAD28wSFAd7BEnE6uBdueR",
            output_hash: "db9e8290e1f6ecd7159e122419918f14be2047c5493de0e46f52d63107aa9c98",
            block_height: 1806010,
            rbf: true,
          },
        ],
        block: {
          hash: "0000000000bbb5e4348048f4b0ecc72f61f91d26c68c512157cc8313c989ce89",
          height: 1806010,
          time: "2022-09-12T11:37:00Z",
        },
        account: 1,
        index: 5,
        address: "t1grLcTkpVUjULAD28wSFAd7BEnE6uBdueR",
      },
    ]);
    const balance = await xpub.getXpubBalance();

    const txInfo = await xpub.buildTx({
      destAddress: "t1T8MQwJhUiDdxP2XCfcLviTPCsnQJyfcL1",
      amount: new BigNumber(balance),
      feePerByte: 0,
      changeAddress,
      utxoPickingStrategy,
      sequence: 0,
    });
    const account = await wallet.generateAccount(
      {
        xpub: xpub.xpub,
        path: "44'/0'",
        index: 0,
        currency: "zcash",
        network: "mainnet",
        derivationMode: DerivationModes.LEGACY,
      },
      getCryptoCurrencyById("zcash"),
    );

    const CURRENT_BLOCK_HEIGHT = 2810986;
    account.xpub.currentBlockHeight = CURRENT_BLOCK_HEIGHT;

    // Mock `createPaymentTransaction`
    const mockBtcSigner = new MockBtcSigner();
    mockBtcSigner.createPaymentTransaction = jest.fn().mockResolvedValue("signed_tx");

    await wallet.signAccountTx({
      btc: mockBtcSigner,
      fromAccount: account,
      txInfo,
    });

    expect(mockBtcSigner.createPaymentTransaction).toHaveBeenCalledTimes(1);

    expect(mockBtcSigner.createPaymentTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        inputs: expect.arrayContaining([
          expect.arrayContaining([1806010]),
          expect.arrayContaining([2738883]),
        ]),
        blockHeight: CURRENT_BLOCK_HEIGHT,
      }),
    );
  }, 100000);
});

import * as bip32 from "bip32";
import * as bip39 from "bip39";
import * as bitcoin from "bitcoinjs-lib";
import coininfo from "coininfo";
import axios from "axios";
import BigNumber from "bignumber.js";
import { DerivationModes } from "../types";
import Xpub from "../xpub";
import Litecoin from "../crypto/litecoin";
import BitcoinLikeExplorer from "../explorer";
import BitcoinLikeStorage from "../storage";
import { Merge } from "../pickingstrategies/Merge";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/*
In order to launch this litecoin test locally
TICKER=ltc TAG=latest LOG_LEVEL=debug docker-compose -f ./environments/explorer-praline-btc.yml up -d
*/
// FIXME Skipped because Praline required on CI
describe.skip("testing xpub legacy litecoin transactions", () => {
  const explorer = new BitcoinLikeExplorer({
    cryptoCurrency: getCryptoCurrencyById("litecoin"),
  });

  const network = coininfo.litecoin.test.toBitcoinJS();
  const crypto = new Litecoin({ network });

  const xpubs = [1, 2, 3].map(i => {
    const storage = new BitcoinLikeStorage();
    const seed = bip39.mnemonicToSeedSync(`test${i} test${i} test${i}`);
    const node = bip32.fromSeed(seed, network);
    const signer = (account: number, index: number) =>
      bitcoin.ECPair.fromWIF(node.derive(account).derive(index).toWIF(), network);
    const xpub = new Xpub({
      storage,
      explorer,
      crypto,
      xpub: node.neutered().toBase58(),
      derivationMode: DerivationModes.LEGACY,
    });

    return {
      storage,
      seed,
      node,
      signer,
      xpub,
    };
  });

  beforeAll(async () => {
    const { address } = await xpubs[0].xpub.getNewAddress(0, 0);
    try {
      await axios.post("http://localhost:28443/chain/clear/all");
      await axios.post(`http://localhost:28443/chain/mine/${address}/1`);
      await axios.post(`http://localhost:28443/chain/faucet/${address}/7.0`);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log("praline setup error", e);
    }

    // time for explorer to sync
    await sleep(30000);

    try {
      await xpubs[0].xpub.sync();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log("praline explorer setup error", e);
    }
  }, 70000);

  it("should be setup correctly", async () => {
    const balance1 = await xpubs[0].xpub.getXpubBalance();
    expect(balance1.toNumber()).toEqual(5700000000);
  });

  let expectedFee1: number;
  it("should send a 1 litecoin tx to xpubs[1].xpub", async () => {
    const { address } = await xpubs[1].xpub.getNewAddress(0, 0);
    const changeAddress = await xpubs[0].xpub.getNewAddress(1, 0);
    const psbt = new bitcoin.Psbt({ network });

    const utxoPickingStrategy = new Merge(xpubs[0].xpub.crypto, xpubs[0].xpub.derivationMode, []);

    const { inputs, associatedDerivations, outputs } = await xpubs[0].xpub.buildTx({
      destAddress: address,
      amount: new BigNumber(100000000),
      feePerByte: 100,
      changeAddress,
      utxoPickingStrategy,
      sequence: 0,
    });

    inputs.forEach(input => {
      const nonWitnessUtxo = Buffer.from(input.txHex, "hex");
      const tx = bitcoin.Transaction.fromHex(input.txHex);

      psbt.addInput({
        hash: tx.getId(),
        index: input.output_index,
        nonWitnessUtxo,
      } as any);
    });
    outputs.forEach(output => {
      psbt.addOutput({
        script: output.script,
        value: output.value.toNumber(),
      });
    });
    expect(outputs.length).toEqual(2);
    inputs.forEach((_, i) => {
      psbt.signInput(i, xpubs[0].signer(associatedDerivations[i][0], associatedDerivations[i][1]));
      psbt.validateSignaturesOfInput(i);
    });
    psbt.finalizeAllInputs();
    const rawTxHex = psbt.extractTransaction().toHex();
    //

    try {
      await xpubs[0].xpub.broadcastTx(rawTxHex);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log("broadcast error", e);
    }

    // time for explorer to sync
    await sleep(40000);

    try {
      const { address: mineAddress } = await xpubs[2].xpub.getNewAddress(0, 0);
      await axios.post(`http://localhost:28443/chain/mine/${mineAddress}/1`);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log("praline error");
    }
    await sleep(40000);
    await xpubs[0].xpub.sync();
    await xpubs[1].xpub.sync();

    expectedFee1 = 10 * 100 + inputs.length * 100 * 180 + outputs.length * 34 * 100;

    expect((await xpubs[0].xpub.getXpubBalance()).toNumber()).toEqual(
      5700000000 - 100000000 - expectedFee1,
    );
    expect((await xpubs[1].xpub.getXpubBalance()).toNumber()).toEqual(100000000);
  }, 100000);
});

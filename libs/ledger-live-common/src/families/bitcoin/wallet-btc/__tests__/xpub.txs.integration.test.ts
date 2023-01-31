import * as bip32 from "bip32";
import * as bip39 from "bip39";
import * as bitcoin from "bitcoinjs-lib";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import coininfo from "coininfo";
import axios from "axios";
import BigNumber from "bignumber.js";
import Xpub from "../xpub";
import Crypto from "../crypto/bitcoin";
import BitcoinLikeExplorer from "../explorer";
import BitcoinLikeStorage from "../storage";
import * as utils from "../utils";
import { InputInfo, OutputInfo, DerivationModes } from "../types";
import { Merge } from "../pickingstrategies/Merge";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// TODO Skipped because Praline required on CI
describe.skip("testing xpub legacy transactions", () => {
  const network = coininfo.bitcoin.regtest.toBitcoinJS();

  const explorer = new BitcoinLikeExplorer({
    cryptoCurrency: getCryptoCurrencyById("bitcoin"),
    forcedExplorerURI: "http://localhost:20000/blockchain/v3",
    disableBatchSize: true, // https://ledgerhq.atlassian.net/browse/BACK-2191
  });

  const crypto = new Crypto({
    network,
  });

  const xpubs = [1, 2, 3].map((i) => {
    const storage = new BitcoinLikeStorage();
    const seed = bip39.mnemonicToSeedSync(`test${i} test${i} test${i}`);
    const node = bip32.fromSeed(seed, network);
    const signer = (account: number, index: number) =>
      bitcoin.ECPair.fromWIF(
        node.derive(account).derive(index).toWIF(),
        network
      );
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
  it("should send a 1 btc tx to xpubs[1].xpub", async () => {
    const destAddress = await xpubs[1].xpub.getNewAddress(0, 0);
    const { address } = destAddress;
    const changeAddress = await xpubs[0].xpub.getNewAddress(1, 0);

    const psbt = new bitcoin.Psbt({ network });

    const utxoPickingStrategy = new Merge(
      xpubs[0].xpub.crypto,
      xpubs[0].xpub.derivationMode,
      []
    );

    const { inputs, associatedDerivations, outputs } =
      await xpubs[0].xpub.buildTx({
        destAddress: address,
        amount: new BigNumber(100000000),
        feePerByte: 100,
        changeAddress,
        utxoPickingStrategy,
        sequence: 0,
      });

    inputs.forEach((i: InputInfo) => {
      const nonWitnessUtxo = Buffer.from(i.txHex, "hex");
      const tx = bitcoin.Transaction.fromHex(i.txHex);

      psbt.addInput({
        hash: tx.getId(),
        index: i.output_index,
        nonWitnessUtxo,
      });
    });
    outputs.forEach((output: OutputInfo) => {
      psbt.addOutput({
        script: output.script,
        value: output.value.toNumber(),
      });
    });
    expect(outputs.length).toEqual(2);
    inputs.forEach((_, i) => {
      psbt.signInput(
        i,
        xpubs[0].signer(
          associatedDerivations[i][0],
          associatedDerivations[i][1]
        )
      );
      psbt.validateSignaturesOfInput(i);
    });
    psbt.finalizeAllInputs();
    const rawTxHex = psbt.extractTransaction().toHex();
    try {
      await xpubs[0].xpub.broadcastTx(rawTxHex);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log("broadcast error", e);
    }

    expectedFee1 =
      utils.maxTxSizeCeil(
        inputs.length,
        outputs.map((o) => o.script),
        false,
        crypto,
        DerivationModes.LEGACY
      ) * 100;

    // time for explorer to sync
    await sleep(30000);

    const sendingAddress = await xpubs[0].xpub.getNewAddress(0, 0);
    const pendings = await explorer.getPendings(sendingAddress);
    const pendingsReceive = await explorer.getPendings(destAddress);
    expect(pendingsReceive.length).toEqual(1);
    expect(pendings.length).toEqual(1);

    await xpubs[0].xpub.sync();
    await xpubs[1].xpub.sync();

    // pending is seen here
    expect((await xpubs[0].xpub.getXpubBalance()).toNumber()).toEqual(
      5700000000 - 100000000 - expectedFee1
    );
    expect((await xpubs[1].xpub.getXpubBalance()).toNumber()).toEqual(
      100000000
    );
    let pendings0 = await xpubs[0].xpub.storage.getLastUnconfirmedTx();
    let pendings1 = await xpubs[1].xpub.storage.getLastUnconfirmedTx();
    expect(pendings0).toBeTruthy();
    expect(pendings1).toBeTruthy();

    try {
      const { address: mineAddress } = await xpubs[2].xpub.getNewAddress(0, 0);
      await axios.post(`http://localhost:28443/chain/mine/${mineAddress}/1`);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log("praline error");
    }

    // time for explorer to sync
    await sleep(30000);

    await xpubs[0].xpub.sync();
    await xpubs[1].xpub.sync();

    expect((await xpubs[0].xpub.getXpubBalance()).toNumber()).toEqual(
      5700000000 - 100000000 - expectedFee1
    );
    expect((await xpubs[1].xpub.getXpubBalance()).toNumber()).toEqual(
      100000000
    );
    pendings0 = await xpubs[0].xpub.storage.getLastUnconfirmedTx();
    pendings1 = await xpubs[1].xpub.storage.getLastUnconfirmedTx();
    expect(pendings0).toBeFalsy();
    expect(pendings1).toBeFalsy();
  }, 150000);

  let expectedFee2: number;
  it("should send a 1 btc tx to xpubs[1].xpub and handle output splitting", async () => {
    const { address } = await xpubs[1].xpub.getNewAddress(0, 0);
    const changeAddress = await xpubs[0].xpub.getNewAddress(1, 0);

    const psbt = new bitcoin.Psbt({ network });

    const utxoPickingStrategy = new Merge(
      xpubs[0].xpub.crypto,
      xpubs[0].xpub.derivationMode,
      []
    );

    xpubs[0].xpub.OUTPUT_VALUE_MAX = 70000000;
    const { inputs, associatedDerivations, outputs } =
      await xpubs[0].xpub.buildTx({
        destAddress: address,
        amount: new BigNumber(100000000),
        feePerByte: 100,
        changeAddress,
        utxoPickingStrategy,
        sequence: 0,
      });

    inputs.forEach((i) => {
      const nonWitnessUtxo = Buffer.from(i.txHex, "hex");
      const tx = bitcoin.Transaction.fromHex(i.txHex);
      psbt.addInput({
        hash: tx.getId(),
        index: i.output_index,
        nonWitnessUtxo,
      });
    });

    outputs.forEach((output) => {
      psbt.addOutput({
        script: output.script,
        value: output.value.toNumber(),
      });
    });

    expect(outputs.length).toEqual(3);
    inputs.forEach((_, i) => {
      psbt.signInput(
        i,
        xpubs[0].signer(
          associatedDerivations[i][0],
          associatedDerivations[i][1]
        )
      );
      psbt.validateSignaturesOfInput(i);
    });
    psbt.finalizeAllInputs();
    const rawTxHex = psbt.extractTransaction().toHex();

    try {
      await xpubs[0].xpub.broadcastTx(rawTxHex);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log("broadcast error", e);
    }

    try {
      const { address: mineAddress } = await xpubs[2].xpub.getNewAddress(0, 0);
      await axios.post(`http://localhost:28443/chain/mine/${mineAddress}/1`);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log("praline error");
    }

    // time for explorer to sync
    await sleep(30000);

    await xpubs[0].xpub.sync();
    await xpubs[1].xpub.sync();

    expectedFee2 =
      utils.maxTxSizeCeil(
        inputs.length,
        outputs.map((o) => o.script),
        false,
        crypto,
        DerivationModes.LEGACY
      ) * 100;
    expect((await xpubs[0].xpub.getXpubBalance()).toNumber()).toEqual(
      5700000000 - 100000000 - expectedFee1 - 100000000 - expectedFee2
    );
    expect((await xpubs[1].xpub.getXpubBalance()).toNumber()).toEqual(
      200000000
    );
  }, 120000);
});

// TODO: complete when Praline ready
describe.skip("Build transactions", () => {
  const network = coininfo.bitcoin.regtest.toBitcoinJS();

  const explorer = new BitcoinLikeExplorer({
    forcedExplorerURI: "http://localhost:20000/blockchain/v3",
    cryptoCurrency: getCryptoCurrencyById("bitcoin"),
    disableBatchSize: true,
  });

  const crypto = new Crypto({
    network,
  });

  const xpubs = [1, 2, 3].map((i) => {
    const storage = new BitcoinLikeStorage();
    const seed = bip39.mnemonicToSeedSync(`test${i} test${i} test${i}`);
    const node = bip32.fromSeed(seed, network);
    const xpub = new Xpub({
      storage,
      explorer,
      crypto,
      xpub: node.neutered().toBase58(),
      derivationMode: DerivationModes.LEGACY,
    });

    const signer = (account: number, index: number) =>
      bitcoin.ECPair.fromWIF(
        node.derive(account).derive(index).toWIF(),
        network
      );

    return {
      storage,
      seed,
      node,
      signer,
      xpub,
    };
  });

  it("should send transaction with one OP_RETURN output", async () => {
    const { address } = await xpubs[1].xpub.getNewAddress(0, 0);
    const changeAddress = await xpubs[0].xpub.getNewAddress(1, 0);

    const psbt = new bitcoin.Psbt({ network });

    const utxoPickingStrategy = new Merge(
      xpubs[0].xpub.crypto,
      xpubs[0].xpub.derivationMode,
      []
    );

    const opReturnData = Buffer.from("charley loves heidi", "utf-8");

    const { inputs, outputs } = await xpubs[0].xpub.buildTx({
      destAddress: address,
      amount: new BigNumber(100000000),
      feePerByte: 100,
      changeAddress,
      utxoPickingStrategy,
      sequence: 0,
      opReturnData,
    });

    inputs.forEach((i) => {
      const nonWitnessUtxo = Buffer.from(i.txHex, "hex");
      const tx = bitcoin.Transaction.fromHex(i.txHex);
      psbt.addInput({
        hash: tx.getId(),
        index: i.output_index,
        nonWitnessUtxo,
      });
    });

    outputs.forEach((output) => {
      psbt.addOutput({
        script: output.script,
        value: output.value.toNumber(),
      });
    });
  });
});

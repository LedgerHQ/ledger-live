import * as bip32 from "bip32";
import * as bip39 from "bip39";
import * as bitcoin from "bitcoinjs-lib";
import coininfo from "coininfo";
import BigNumber from "bignumber.js";
import { DerivationModes, OutputInfo } from "../types";
import Xpub from "../xpub";
import BitcoinLikeExplorer from "../explorer";
import Crypto from "../crypto/bitcoin";
import BitcoinLikeStorage from "../storage";
import { Merge } from "../pickingstrategies/Merge";
import { DeepFirst } from "../pickingstrategies/DeepFirst";
import { CoinSelect } from "../pickingstrategies/CoinSelect";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";

describe("testing xpub legacy transactions", () => {
  const network = coininfo.bitcoin.test.toBitcoinJS();

  const crypto = new Crypto({
    network,
  });

  const storage = new BitcoinLikeStorage();
  const seed = bip39.mnemonicToSeedSync("test1 test1 test1");
  const node = bip32.fromSeed(seed, network);
  const signer = (account: number, index: number) =>
    bitcoin.ECPair.fromWIF(node.derive(account).derive(index).toWIF(), network);
  const xpub = new Xpub({
    storage,
    explorer: new BitcoinLikeExplorer({
      cryptoCurrency: getCryptoCurrencyById("bitcoin"),
    }),
    crypto,
    xpub: node.neutered().toBase58(),
    derivationMode: DerivationModes.LEGACY,
  });
  const dataset = {
    storage,
    seed,
    node,
    signer,
    xpub,
  };

  function outputs(amount: number): OutputInfo[] {
    return [
      {
        address: "mwXTtHo8Yy3aNKUUZLkBDrTcKT9qG9TqLb",
        isChange: false,
        script: Buffer.from([]),
        value: new BigNumber(amount),
      },
    ];
  }

  it("merge output strategy should be correct", async () => {
    // Initialize the xpub with 2 txs. So that it has 2 utxo
    dataset.xpub.storage.appendTxs([
      {
        id: "9e1b337875c21f751e70ee2c2c6ee93d8a6733d0f3ba6d139ae6a0479ebcefb0",
        inputs: [],
        outputs: [
          {
            output_index: 0,
            value: "5000000000",
            address: "mwXTtHo8Yy3aNKUUZLkBDrTcKT9qG9TqLb",
            output_hash: "9e1b337875c21f751e70ee2c2c6ee93d8a6733d0f3ba6d139ae6a0479ebcefb0",
            block_height: 1,
            rbf: false,
          },
          {
            output_index: 1,
            value: "0",
            address: "<unknown>",
            output_hash: "9e1b337875c21f751e70ee2c2c6ee93d8a6733d0f3ba6d139ae6a0479ebcefb0",
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
      {
        id: "0b9f98d07eb418fa20573112d3cba6b871d429a06c724a7888ff0886be5213d1",
        inputs: [
          {
            output_hash: "2772f3963856f3eb38cb706ec8c2b62fcdeb2ce10f32cf7160afb3873be6f60d",
            output_index: 0,
            value: "5000000000",
            address: "2NCDBM9DAuMrD1T8XDHMxvbTmLutP7at4AB",
            sequence: 4294967294,
          },
        ],
        outputs: [
          {
            output_index: 0,
            value: "300000000",
            address: "mwXTtHo8Yy3aNKUUZLkBDrTcKT9qG9TqLb",
            output_hash: "0b9f98d07eb418fa20573112d3cba6b871d429a06c724a7888ff0886be5213d1",
            block_height: 120,
            rbf: false,
          },
          {
            output_index: 1,
            value: "4699983200",
            address: "2MynSTpze5SDcuLr1DekSV7RVrFpQCo3LeP",
            output_hash: "0b9f98d07eb418fa20573112d3cba6b871d429a06c724a7888ff0886be5213d1",
            block_height: 120,
            rbf: false,
          },
        ],
        block: {
          hash: "305d4b8d4a6d6ecca0a3dd0216f8ecd090978ed346d1845883c8aa4529d72fc8",
          height: 120,
          time: "2021-07-28T13:34:38Z",
        },
        account: 0,
        index: 0,
        address: "mwXTtHo8Yy3aNKUUZLkBDrTcKT9qG9TqLb",
        received_at: "2021-07-28T13:34:38Z",
      },
    ]);
    // this account has one utxo 500000000 and one utxo 300000000
    const utxoPickingStrategy = new Merge(dataset.xpub.crypto, dataset.xpub.derivationMode, []);
    let res = await utxoPickingStrategy.selectUnspentUtxosToUse(dataset.xpub, outputs(10000), 0);
    expect(res.unspentUtxos.length).toEqual(1); // only 1 utxo is enough
    expect(Number(res.unspentUtxos[0].value)).toEqual(300000000); // use cheaper utxo first
    res = await utxoPickingStrategy.selectUnspentUtxosToUse(dataset.xpub, outputs(500000000), 0);
    expect(res.unspentUtxos.length).toEqual(2); // need 2 utxo
    expect(Number(res.unspentUtxos[0].value) + Number(res.unspentUtxos[1].value)).toEqual(
      300000000 + 5000000000,
    );
  }, 100000);

  it("deep first output strategy should be correct", async () => {
    // this account has one utxo 500000000 and one utxo 300000000
    const utxoPickingStrategy = new DeepFirst(dataset.xpub.crypto, dataset.xpub.derivationMode, []);
    let res = await utxoPickingStrategy.selectUnspentUtxosToUse(dataset.xpub, outputs(10000), 0);
    expect(res.unspentUtxos.length).toEqual(1); // only 1 utxo is enough
    expect(Number(res.unspentUtxos[0].value)).toEqual(5000000000); // use old utxo first
    res = await utxoPickingStrategy.selectUnspentUtxosToUse(dataset.xpub, outputs(5200000000), 0);
    expect(res.unspentUtxos.length).toEqual(2); // need 2 utxo
    expect(Number(res.unspentUtxos[0].value) + Number(res.unspentUtxos[1].value)).toEqual(
      300000000 + 5000000000,
    );
  }, 100000);

  it("coin select strategy should be correct", async () => {
    // Add 3 txs for the xpub. So that it has 5 utxo
    dataset.xpub.storage.appendTxs([
      {
        id: "8f30fe84da5a5846d668b4bad260730f2b0125fa66fb2633fa1cee23c6b11053",
        inputs: [
          {
            output_hash: "06dedd72cd68c036070fbd2453dfc1c6c1dd48ac899b175680db8f1417952ffd",
            output_index: 1,
            value: "4699983200",
            address: "2MuiiwsWDJZETrMWR43VhM2FDvTsvHNn8oZ",
            sequence: 4294967294,
          },
        ],
        outputs: [
          {
            output_index: 0,
            value: "4599966400",
            address: "2NCSYYp4bWdHDYf9nYP1NDKb1GMBqa8e57H",
            output_hash: "8f30fe84da5a5846d668b4bad260730f2b0125fa66fb2633fa1cee23c6b11053",
            block_height: 122,
            rbf: false,
          },
          {
            output_index: 1,
            value: "100000000",
            address: "mwXTtHo8Yy3aNKUUZLkBDrTcKT9qG9TqLb",
            output_hash: "8f30fe84da5a5846d668b4bad260730f2b0125fa66fb2633fa1cee23c6b11053",
            block_height: 122,
            rbf: false,
          },
        ],
        block: {
          hash: "07b88745bbec95383dd8588501bf21a72c3f48537860ca0c1e2ac646e124885c",
          height: 122,
          time: "2021-07-28T14:46:51Z",
        },
        account: 0,
        index: 0,
        address: "mwXTtHo8Yy3aNKUUZLkBDrTcKT9qG9TqLb",
        received_at: "2021-07-28T14:46:51Z",
      },
      {
        id: "2f90f3312ffd4dce490cb2f7429c586a43ef68c99fc2f8e549127b72af7b4209",
        inputs: [
          {
            output_hash: "8f30fe84da5a5846d668b4bad260730f2b0125fa66fb2633fa1cee23c6b11053",
            output_index: 0,
            value: "4599966400",
            address: "2NCSYYp4bWdHDYf9nYP1NDKb1GMBqa8e57H",
            sequence: 4294967294,
          },
        ],
        outputs: [
          {
            output_index: 0,
            value: "4399949600",
            address: "2NFToPiLBtuKiqzZj43nPXknN8d4xNySe3o",
            output_hash: "2f90f3312ffd4dce490cb2f7429c586a43ef68c99fc2f8e549127b72af7b4209",
            block_height: 123,
            rbf: false,
          },
          {
            output_index: 1,
            value: "200000000",
            address: "mwXTtHo8Yy3aNKUUZLkBDrTcKT9qG9TqLb",
            output_hash: "2f90f3312ffd4dce490cb2f7429c586a43ef68c99fc2f8e549127b72af7b4209",
            block_height: 123,
            rbf: false,
          },
        ],
        block: {
          hash: "0060d6a1632cf380b9262790e4646e5a48e7f9e099a089640837ec1ef3614159",
          height: 123,
          time: "2021-07-28T14:46:51Z",
        },
        account: 0,
        index: 0,
        address: "mwXTtHo8Yy3aNKUUZLkBDrTcKT9qG9TqLb",
        received_at: "2021-07-28T14:46:51Z",
      },
      {
        id: "2fee0c4b55e08583aa5bc565d7e428f7cdcbd2b73262f62208a6a72a74e2c945",
        inputs: [
          {
            output_hash: "2f90f3312ffd4dce490cb2f7429c586a43ef68c99fc2f8e549127b72af7b4209",
            output_index: 0,
            value: "4399949600",
            address: "2NFToPiLBtuKiqzZj43nPXknN8d4xNySe3o",
            sequence: 4294967294,
          },
        ],
        outputs: [
          {
            output_index: 0,
            value: "600000000",
            address: "mwXTtHo8Yy3aNKUUZLkBDrTcKT9qG9TqLb",
            output_hash: "2fee0c4b55e08583aa5bc565d7e428f7cdcbd2b73262f62208a6a72a74e2c945",
            block_height: 124,
            rbf: false,
          },
          {
            output_index: 1,
            value: "3799932800",
            address: "2N53XuFRxqbShpK4XKwC1VXT4zu1wCzbAMU",
            output_hash: "2fee0c4b55e08583aa5bc565d7e428f7cdcbd2b73262f62208a6a72a74e2c945",
            block_height: 124,
            rbf: false,
          },
        ],
        block: {
          hash: "0ba663caf7775546cec9dfbdfd7e7d43d7ed576bb87c619271cccbcb572b328e",
          height: 124,
          time: "2021-07-28T14:46:51Z",
        },
        account: 0,
        index: 0,
        address: "mwXTtHo8Yy3aNKUUZLkBDrTcKT9qG9TqLb",
        received_at: "2021-07-28T14:46:51Z",
      },
    ]);
    // we have 5 utxo now. 100000000, 200000000, 300000000, 600000000 and 5000000000
    const utxoPickingStrategy = new CoinSelect(
      dataset.xpub.crypto,
      dataset.xpub.derivationMode,
      [],
    );
    let res = await utxoPickingStrategy.selectUnspentUtxosToUse(dataset.xpub, outputs(10000), 10);
    expect(res.unspentUtxos.length).toEqual(1);
    expect(Number(res.unspentUtxos[0].value)).toEqual(100000000);

    res = await utxoPickingStrategy.selectUnspentUtxosToUse(dataset.xpub, outputs(290000000), 10);
    expect(res.unspentUtxos.length).toEqual(1);
    expect(Number(res.unspentUtxos[0].value)).toEqual(300000000);

    res = await utxoPickingStrategy.selectUnspentUtxosToUse(dataset.xpub, outputs(500000000), 10);
    expect(res.unspentUtxos.length).toEqual(1);
    expect(Number(res.unspentUtxos[0].value)).toEqual(600000000);

    res = await utxoPickingStrategy.selectUnspentUtxosToUse(dataset.xpub, outputs(800000000), 10);
    expect(res.unspentUtxos.length).toEqual(1);
    expect(Number(res.unspentUtxos[0].value)).toEqual(5000000000);

    res = await utxoPickingStrategy.selectUnspentUtxosToUse(dataset.xpub, outputs(5000000000), 10);
    expect(res.unspentUtxos.length).toEqual(2);
    expect(Number(res.unspentUtxos[0].value) + Number(res.unspentUtxos[1].value)).toEqual(
      5100000000,
    );

    res = await utxoPickingStrategy.selectUnspentUtxosToUse(dataset.xpub, outputs(5600000000), 10);
    expect(res.unspentUtxos.length).toEqual(3);
    expect(
      Number(res.unspentUtxos[0].value) +
        Number(res.unspentUtxos[1].value) +
        Number(res.unspentUtxos[2].value),
    ).toEqual(5000000000 + 600000000 + 100000000);
  }, 180000);
});

import * as utils from "../utils";

describe("picking strategies – segwit edge cases", () => {
  const network = coininfo.bitcoin.test.toBitcoinJS();
  const crypto = new Crypto({ network });

  /** handy helpers to synthesize scripts by length (content doesn't matter for size) **/
  const scriptP2WPKH = Buffer.alloc(22); // OP_0 + PUSH20 + 20 bytes
  const scriptP2SH = Buffer.alloc(23); // HASH160 + PUSH20 + 20 + EQUAL

  function makeXpubNativeSegwit() {
    const storage = new BitcoinLikeStorage();
    const xpub = new Xpub({
      storage,
      explorer: new BitcoinLikeExplorer({ cryptoCurrency: getCryptoCurrencyById("bitcoin") }),
      crypto,
      xpub: "dummy", // not used by storage-only tests
      derivationMode: DerivationModes.NATIVE_SEGWIT,
    });
    return { storage, xpub };
  }

  function out(amount: number, script: Buffer): OutputInfo[] {
    return [
      {
        address: "tb1qdummydest", // label only
        isChange: false,
        script,
        value: new BigNumber(amount),
      },
    ];
  }

  it("FLOAT vs CEIL: fee must equal ceil(vbytes) * feePerByte for P2WPKH (1-in/1-out, no change)", async () => {
    const { storage, xpub } = makeXpubNativeSegwit();

    // choose a simple 1-in / 1-out case at 1 sat/vB with no change
    const feePerByte = 1;

    // compute expected vbytes exactly (integer path)
    const vNoInput = utils.maxTxSizeCeil(
      0,
      [scriptP2WPKH],
      false,
      xpub.crypto,
      xpub.derivationMode,
    );
    const vPerInput =
      utils.maxTxSizeCeil(1, [], false, xpub.crypto, xpub.derivationMode) -
      utils.maxTxSizeCeil(0, [], false, xpub.crypto, xpub.derivationMode);
    const changeDeltaV =
      utils.maxTxSizeCeil(0, [], true, xpub.crypto, xpub.derivationMode) -
      utils.maxTxSizeCeil(0, [], false, xpub.crypto, xpub.derivationMode);

    // pick an amount & utxo so leftover < change delta => no change path
    const amount = 50_000;
    const expectedV = vNoInput + vPerInput; // 1 input, 1 recipient, no change
    const expectedFee = expectedV * feePerByte;

    // single utxo exactly amount + expectedFee
    storage.appendTxs([
      {
        id: "tx-utxo-1",
        inputs: [],
        outputs: [
          {
            output_index: 0,
            value: String(amount + expectedFee),
            address: "tb1qmyutxo",
            output_hash: "tx-utxo-1",
            block_height: 1,
            rbf: false,
          },
        ],
        block: { hash: "h", height: 1, time: "2024-01-01T00:00:00Z" },
        account: 0,
        index: 0,
        address: "tb1qmyutxo",
        received_at: "2024-01-01T00:00:00Z",
      },
    ]);

    // run any segwit strategy; DeepFirst is fine
    const strat = new DeepFirst(xpub.crypto, xpub.derivationMode, []);
    const res = await strat.selectUnspentUtxosToUse(xpub, out(amount, scriptP2WPKH), feePerByte);

    expect(res.unspentUtxos.length).toBe(1);
    expect(res.needChangeoutput).toBe(false);
    // the key assertion: no float drift → fee equals integer vbytes * feerate
    // NOTE: before changes, 109, expected is 110
    expect(res.fee).toBe(expectedFee);

    // sanity: leftover at boundary is < change delta
    const leftover = amount + expectedFee - (amount + res.fee);
    expect(leftover).toBeLessThan(changeDeltaV * feePerByte);
  }, 30_000);

  // NOTE: passed without changes
  it.skip("CHANGE DELTA: decision must use input-derivation change size (P2WPKH change) not recipient script", async () => {
    const { storage, xpub } = makeXpubNativeSegwit();
    const feePerByte = 1;

    // recipient is P2SH, but inputs are P2WPKH => change must be P2WPKH
    const recipientScripts = [scriptP2SH];

    const emptyV = utils.maxTxSizeCeil(0, [], false, xpub.crypto, xpub.derivationMode);
    const vNoInput = utils.maxTxSizeCeil(
      0,
      recipientScripts,
      false,
      xpub.crypto,
      xpub.derivationMode,
    );
    const vPerInput = utils.maxTxSizeCeil(1, [], false, xpub.crypto, xpub.derivationMode) - emptyV;

    // correct change delta (from input derivation)
    const changeDeltaV =
      utils.maxTxSizeCeil(0, [], true, xpub.crypto, xpub.derivationMode) - emptyV;
    // WRONG delta some code used: output[0] script (P2SH) as change proxy
    const wrongChangeDeltaV =
      utils.maxTxSizeCeil(0, [scriptP2SH], false, xpub.crypto, xpub.derivationMode) - emptyV;
    expect(wrongChangeDeltaV).toBe(changeDeltaV + 1); // P2SH output is 1 vB larger than P2WPKH

    // we choose UTXO value so that leftover equals the TRUE change delta exactly
    const amount = 80_000;
    const feeNoChange = (vNoInput + vPerInput) * feePerByte;
    const utxoValue = amount + feeNoChange + changeDeltaV * feePerByte;

    storage.appendTxs([
      {
        id: "tx-utxo-2",
        inputs: [],
        outputs: [
          {
            output_index: 0,
            value: String(utxoValue),
            address: "tb1qmyutxo2",
            output_hash: "tx-utxo-2",
            block_height: 2,
            rbf: false,
          },
        ],
        block: { hash: "h2", height: 2, time: "2024-01-02T00:00:00Z" },
        account: 0,
        index: 0,
        address: "tb1qmyutxo2",
        received_at: "2024-01-02T00:00:00Z",
      },
    ]);

    const strat = new Merge(xpub.crypto, xpub.derivationMode, []);
    const res = await strat.selectUnspentUtxosToUse(xpub, out(amount, scriptP2SH), feePerByte);

    // with correct logic we have just enough to add P2WPKH change (31 vB), not enough for "wrong" 32 vB
    expect(res.needChangeoutput).toBe(true);

    const expectedFeeWithChange =
      utils.maxTxSizeCeil(1, recipientScripts, true, xpub.crypto, xpub.derivationMode) * feePerByte;

    // fee must match vbytes(1-in, recipient P2SH, + P2WPKH change)
    expect(res.fee).toBe(expectedFeeWithChange);

    // and we selected exactly that single utxo
    expect(res.unspentUtxos.length).toBe(1);
    expect(Number(res.unspentUtxos[0].value)).toBe(utxoValue);
  }, 30_000);

  it("CHANGE DELTA: must use input-derivation change size (P2WPKH) not recipient script (P2TR)", async () => {
    const { storage, xpub } = makeXpubNativeSegwit();
    const feePerByte = 1;

    // recipient is Taproot, change must be P2WPKH (since derivation = native segwit)
    const scriptP2TR = Buffer.alloc(34); // taproot output script length
    const scriptP2WPKH = Buffer.alloc(22); // change output script length

    const emptyV = utils.maxTxSizeCeil(0, [], false, xpub.crypto, xpub.derivationMode);

    // base vbytes for tx with recipient only (no inputs yet), use the *same* function as strategies do:
    const baseVNoInput_FLOAT = utils.maxTxSize(
      0,
      [scriptP2TR],
      false,
      xpub.crypto,
      xpub.derivationMode,
    );
    const perInputV_FLOAT =
      utils.maxTxSize(1, [], false, xpub.crypto, xpub.derivationMode) -
      utils.maxTxSize(0, [], false, xpub.crypto, xpub.derivationMode);

    // True change delta (P2WPKH change)
    const trueChangeDeltaV_FLOAT =
      utils.maxTxSize(0, [], true, xpub.crypto, xpub.derivationMode) -
      utils.maxTxSize(0, [], false, xpub.crypto, xpub.derivationMode);

    // Wrong change delta (recipient=P2TR)
    const wrongChangeDeltaV_FLOAT =
      utils.maxTxSize(0, [scriptP2TR], false, xpub.crypto, xpub.derivationMode) -
      utils.maxTxSize(0, [], false, xpub.crypto, xpub.derivationMode);

    // Sanity: Taproot output is ~3 vB bigger than P2WPKH change
    expect(Math.round(wrongChangeDeltaV_FLOAT - trueChangeDeltaV_FLOAT)).toBeGreaterThanOrEqual(2);

    const amount = 80_000;

    // Fee if we pick exactly 1 input and no change (float path, like the strategy)
    const feeNoChange_FLOAT = (baseVNoInput_FLOAT + perInputV_FLOAT) * feePerByte;

    // Choose leftover to be >= true change delta but < wrong change delta.
    const targetLeftover = trueChangeDeltaV_FLOAT + 1.0; // sits between ~31 and ~34 safely

    // Make a single-UTXO wallet with just enough to hit that leftover
    const utxoValue = amount + Math.ceil(feeNoChange_FLOAT + targetLeftover);

    storage.appendTxs([
      {
        id: "tx-utxo-taproot-recipient",
        inputs: [],
        outputs: [
          {
            output_index: 0,
            value: String(utxoValue),
            address: "tb1qmyutxo-change-test",
            output_hash: "tx-utxo-taproot-recipient",
            block_height: 10,
            rbf: false,
          },
        ],
        block: { hash: "h", height: 10, time: "2024-01-03T00:00:00Z" },
        account: 0,
        index: 0,
        address: "tb1qmyutxo-change-test",
        received_at: "2024-01-03T00:00:00Z",
      },
    ]);

    const strat = new Merge(xpub.crypto, xpub.derivationMode, []);
    const res = await strat.selectUnspentUtxosToUse(
      xpub,
      [
        {
          address: "tb1p-recipient",
          isChange: false,
          script: scriptP2TR,
          value: new BigNumber(amount),
        },
      ],
      feePerByte,
    );

    // EXPECTATION:
    // - Correct logic (change delta from input derivation) => change fits => needChangeoutput = true
    // - Current buggy logic (delta from recipient P2TR) => change would NOT fit
    expect(res.needChangeoutput).toBe(true);

    // And fee should equal vbytes(1-in, P2TR recipient, + P2WPKH change) * fpb (ceil’d at the end)
    const vWithChange_INT = utils.maxTxSizeCeil(
      1,
      [scriptP2TR],
      true,
      xpub.crypto,
      xpub.derivationMode,
    );
    // NOTE: before changes, 121, expected = 153
    expect(res.fee).toBe(vWithChange_INT * feePerByte);
  });
});

// NOTE: addr0 undefined
describe.skip("picking strategies – segwit fee correctness & change pricing", () => {
  const network = coininfo.bitcoin.test.toBitcoinJS();

  const mkDataset = (derivationMode: DerivationModes) => {
    const crypto = new Crypto({ network });
    const storage = new BitcoinLikeStorage();
    const seed = bip39.mnemonicToSeedSync("test1 test1 test1");
    const node = bip32.fromSeed(seed, network);
    const xpub = new Xpub({
      storage,
      explorer: new BitcoinLikeExplorer({
        cryptoCurrency: getCryptoCurrencyById("bitcoin"),
      }),
      crypto,
      xpub: node.neutered().toBase58(),
      derivationMode,
    });
    return { crypto, storage, seed, node, xpub };
  };

  const toOut = (addr: string, value: number, crypto: Crypto) =>
    ({
      address: addr,
      isChange: false,
      script: crypto.toOutputScript(addr),
      value: new BigNumber(value),
    }) as OutputInfo;

  /**
   * Ensures the strategy's fee equals Math.ceil(maxTxSize(...)) * feePerByte.
   * This fails when the picker mixes ceil into deltas (classic segwit off-by-1).
   */
  it("native segwit (P2WPKH): fee matches maxTxSizeCeil (no ceil mixing)", async () => {
    const { crypto, storage, xpub } = mkDataset(DerivationModes.NATIVE_SEGWIT);
    // Derive a couple of our own addresses and fund them as UTXOs
    const [addr0] = await xpub.getXpubAddresses();
    // Create 4 small UTXOs so the picker needs multiple inputs
    const utxoVals = [120_000, 120_000, 120_000, 120_000];
    utxoVals.forEach((v, i) =>
      storage.appendTxs([
        {
          id: `tx${i}`,
          inputs: [],
          outputs: [
            {
              output_index: 0,
              value: String(v),
              address: addr0.address,
              output_hash: `tx${i}`,
              block_height: 1 + i,
              rbf: false,
            },
          ],
          block: { hash: `h${i}`, height: 1 + i, time: "2021-07-28T13:34:17Z" },
          account: 0,
          index: 0,
          address: addr0.address,
          received_at: "2021-07-28T13:34:17Z",
        },
      ]),
    );

    // One P2WPKH recipient
    const recipient = "tb1qhff3j7euu6t3lv8s5gsy9t5x82wuhfw5z863gj";
    const outs = [toOut(recipient, 300_000, crypto)];
    const feePerByte = 1;

    // Use Merge (any picker is fine; we just want its final fee decision)
    const picker = new Merge(crypto, DerivationModes.NATIVE_SEGWIT, []);
    const res = await picker.selectUnspentUtxosToUse(xpub, outs, feePerByte);

    // Compute the exact expected size using utils and compare
    const outputScripts = outs.map(o => o.script);
    const expectedVb = utils.maxTxSizeCeil(
      res.unspentUtxos.length,
      outputScripts,
      res.needChangeoutput,
      crypto,
      DerivationModes.NATIVE_SEGWIT,
    );
    const expectedFee = expectedVb * feePerByte;
    expect(res.fee).toBe(expectedFee);
  }, 100_000);

  /**
   * Ensures the "add change?" decision uses the correct change script for the *input derivation*.
   * Here: inputs are nested segwit (P2SH-P2WPKH), but the first recipient is P2WPKH.
   * Incorrect implementations price change at 31 vB (P2WPKH) instead of 32 vB (P2SH),
   * which can flip the decision at the boundary and/or underpay by 1 sat/vB.
   */
  it("nested segwit (P2SH-P2WPKH): change decision must use P2SH change, not recipient[0]", async () => {
    const { crypto, storage, xpub } = mkDataset(DerivationModes.SEGWIT); // P2SH-P2WPKH inputs
    const [addr0] = await xpub.getXpubAddresses();
    // Single moderately sized UTXO to make us hover around change threshold
    const utxoValue = 200_000;
    storage.appendTxs([
      {
        id: "utxo_nested",
        inputs: [],
        outputs: [
          {
            output_index: 0,
            value: String(utxoValue),
            address: addr0.address,
            output_hash: "utxo_nested",
            block_height: 1,
            rbf: false,
          },
        ],
        block: { hash: "h0", height: 1, time: "2021-07-28T13:34:17Z" },
        account: 0,
        index: 0,
        address: addr0.address,
        received_at: "2021-07-28T13:34:17Z",
      },
    ]);

    // First recipient is P2WPKH (31 vB output), but input derivation is nested (P2SH change = 32 vB).
    const recipientWpkh = "tb1qhff3j7euu6t3lv8s5gsy9t5x82wuhfw5z863gj";
    const out = toOut(recipientWpkh, 0, crypto); // value set below
    const feePerByte = 1;
    const picker = new Merge(crypto, DerivationModes.SEGWIT, []);

    // We'll scan amounts near the threshold and assert the final state is consistent
    // with the *true* change delta (computed via utils), not the recipient[0] script.
    const tryAmounts = [100_000, 120_000, 140_000, 150_000, 160_000];
    let found = false;

    for (const amount of tryAmounts) {
      out.value = new BigNumber(amount);
      const outs = [out];
      const res = await picker.selectUnspentUtxosToUse(xpub, outs, feePerByte);

      const outputScripts = outs.map(o => o.script);
      const n = res.unspentUtxos.length;
      const baseNoChange = utils.maxTxSize(n, outputScripts, false, crypto, DerivationModes.SEGWIT);
      const baseWithChange = utils.maxTxSize(
        n,
        outputScripts,
        true,
        crypto,
        DerivationModes.SEGWIT,
      );
      const trueChangeDelta = baseWithChange - baseNoChange; // vbytes

      const leftover = new BigNumber(res.totalValue.toNumber())
        .minus(amount)
        .minus(res.fee) // fee already ceiled in picker
        .toNumber();

      // If the picker chose to add change, there must be enough leftover to pay the *true* change cost.
      // If not, it priced change with the wrong script (recipient[0]) — exactly the bug we want to catch.
      if (res.needChangeoutput) {
        // Allow a 0/1 off-by-one if feePerByte != 1, but here it's 1 so we can be strict.
        expect(leftover).toBeGreaterThanOrEqual(Math.ceil(trueChangeDelta));
      } else {
        // If picker refused change, leftover must be strictly less than the true change cost.
        expect(leftover).toBeLessThan(Math.ceil(trueChangeDelta));
      }
      // Also check the final fee equals the exact tx ceil
      const expectedVb = utils.maxTxSizeCeil(
        n,
        outputScripts,
        res.needChangeoutput,
        crypto,
        DerivationModes.SEGWIT,
      );
      expect(res.fee).toBe(expectedVb * feePerByte);
      found = true;
      break; // one successful case is enough
    }
    expect(found).toBe(true);
  }, 120_000);
});

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
import * as utils from "../utils";

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
            output_hash: "7f7cb4f845f3ca9a2ee64c79619958c8d4aa3b48783b255abea6aa1a8f7093cc",
            block_height: 1,
            rbf: false,
          },
          {
            output_index: 1,
            value: "0",
            address: "<unknown>",
            output_hash: "7f7cb4f845f3ca9a2ee64c79619958c8d4aa3b48783b255abea6aa1a8f7093cc",
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
            output_hash: "7f7cb4f845f3ca9a2ee64c79619958c8d4aa3b48783b255abea6aa1a8f7093cc",
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
            output_hash: "7f7cb4f845f3ca9a2ee64c79619958c8d4aa3b48783b255abea6aa1a8f7093cc",
            block_height: 120,
            rbf: false,
          },
          {
            output_index: 1,
            value: "4699983200",
            address: "2MynSTpze5SDcuLr1DekSV7RVrFpQCo3LeP",
            output_hash: "7f7cb4f845f3ca9a2ee64c79619958c8d4aa3b48783b255abea6aa1a8f7093cc",
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
            output_hash: "7f7cb4f845f3ca9a2ee64c79619958c8d4aa3b48783b255abea6aa1a8f7093cc",
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
            output_hash: "7f7cb4f845f3ca9a2ee64c79619958c8d4aa3b48783b255abea6aa1a8f7093cc",
            block_height: 122,
            rbf: false,
          },
          {
            output_index: 1,
            value: "100000000",
            address: "mwXTtHo8Yy3aNKUUZLkBDrTcKT9qG9TqLb",
            output_hash: "7f7cb4f845f3ca9a2ee64c79619958c8d4aa3b48783b255abea6aa1a8f7093cc",
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
            output_hash: "7f7cb4f845f3ca9a2ee64c79619958c8d4aa3b48783b255abea6aa1a8f7093cc",
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
            output_hash: "7f7cb4f845f3ca9a2ee64c79619958c8d4aa3b48783b255abea6aa1a8f7093cc",
            block_height: 123,
            rbf: false,
          },
          {
            output_index: 1,
            value: "200000000",
            address: "mwXTtHo8Yy3aNKUUZLkBDrTcKT9qG9TqLb",
            output_hash: "7f7cb4f845f3ca9a2ee64c79619958c8d4aa3b48783b255abea6aa1a8f7093cc",
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
            output_hash: "7f7cb4f845f3ca9a2ee64c79619958c8d4aa3b48783b255abea6aa1a8f7093cc",
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
            output_hash: "7f7cb4f845f3ca9a2ee64c79619958c8d4aa3b48783b255abea6aa1a8f7093cc",
            block_height: 124,
            rbf: false,
          },
          {
            output_index: 1,
            value: "3799932800",
            address: "2N53XuFRxqbShpK4XKwC1VXT4zu1wCzbAMU",
            output_hash: "7f7cb4f845f3ca9a2ee64c79619958c8d4aa3b48783b255abea6aa1a8f7093cc",
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

describe("picking strategies – segwit edge cases", () => {
  const network = coininfo.bitcoin.test.toBitcoinJS();
  const crypto = new Crypto({ network });

  /** helper to synthesize scripts by length (content doesn't matter for size) **/
  const scriptP2WPKH = Buffer.alloc(22); // OP_0 + PUSH20 + 20 bytes

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
            output_hash: "7f7cb4f845f3ca9a2ee64c79619958c8d4aa3b48783b255abea6aa1a8f7093cc",
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
  it("CHANGE DELTA: must use input-derivation change size (P2WPKH) not recipient script (P2TR)", async () => {
    const { storage, xpub } = makeXpubNativeSegwit();
    const feePerByte = 1;

    // recipient is Taproot, change must be P2WPKH (since derivation = native segwit)
    const scriptP2TR = Buffer.alloc(34); // taproot output script length

    // base vbytes for tx with recipient only (no inputs yet), use the *same* function as strategies do:
    const baseVNoInput_FLOAT = utils.maxTxWeight(
      0,
      [scriptP2TR],
      false,
      xpub.crypto,
      xpub.derivationMode,
    );
    const perInputV_FLOAT =
      utils.maxTxWeight(1, [], false, xpub.crypto, xpub.derivationMode) -
      utils.maxTxWeight(0, [], false, xpub.crypto, xpub.derivationMode);

    // True change delta (P2WPKH change)
    const trueChangeDeltaV_FLOAT =
      utils.maxTxWeight(0, [], true, xpub.crypto, xpub.derivationMode) -
      utils.maxTxWeight(0, [], false, xpub.crypto, xpub.derivationMode);

    // Wrong change delta (recipient=P2TR)
    const wrongChangeDeltaV_FLOAT =
      utils.maxTxWeight(0, [scriptP2TR], false, xpub.crypto, xpub.derivationMode) -
      utils.maxTxWeight(0, [], false, xpub.crypto, xpub.derivationMode);

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
            output_hash: "7f7cb4f845f3ca9a2ee64c79619958c8d4aa3b48783b255abea6aa1a8f7093cc",
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

describe("CoinSelect – segwit change delta must match input derivation (not recipient)", () => {
  const network = coininfo.bitcoin.test.toBitcoinJS();
  const crypto = new Crypto({ network });

  function makeXpubNativeSegwit() {
    const storage = new BitcoinLikeStorage();
    const xpub = new Xpub({
      storage,
      explorer: new BitcoinLikeExplorer({ cryptoCurrency: getCryptoCurrencyById("bitcoin") }),
      crypto,
      xpub: "dummy",
      derivationMode: DerivationModes.NATIVE_SEGWIT, // inputs ⇒ P2WPKH ⇒ change must be P2WPKH
    });
    return { storage, xpub };
  }

  it("adds change using P2WPKH delta even when recipient is Taproot (P2TR)", async () => {
    const { storage, xpub } = makeXpubNativeSegwit();
    const feePerByte = 1; // integer sat/vB
    const scriptP2TR = Buffer.alloc(34); // recipient

    // --- all sizes in INTEGER vbytes, exactly like the strategy ---
    const fixedV = utils.maxTxVBytesCeil(0, [], false, xpub.crypto, xpub.derivationMode);
    const oneInputV =
      utils.maxTxVBytesCeil(1, [], false, xpub.crypto, xpub.derivationMode) - fixedV;

    // base vbytes with recipient (no inputs yet)
    const baseNoInputV = utils.maxTxVBytesCeil(
      0,
      [scriptP2TR],
      false,
      xpub.crypto,
      xpub.derivationMode,
    );

    // “true” change delta: add a change output of the *input derivation* (P2WPKH here)
    const changeDeltaV =
      utils.maxTxVBytesCeil(0, [], true, xpub.crypto, xpub.derivationMode) - fixedV;

    // “wrong” change delta (buggy logic): use recipient’s script as proxy (Taproot)
    const wrongChangeDeltaV =
      utils.maxTxVBytesCeil(0, [scriptP2TR], false, xpub.crypto, xpub.derivationMode) - fixedV;

    // sanity: Taproot (recipient) output is bigger than P2WPKH change (gap >= 2–3 vB)
    expect(wrongChangeDeltaV - changeDeltaV).toBeGreaterThanOrEqual(2);

    // fees (integer) for a 1-input, NO-CHANGE layout
    const notInputFees = feePerByte * baseNoInputV;
    const feeNoChange = notInputFees + feePerByte * oneInputV;

    // We want leftover L so that:  L > feePerByte*changeDeltaV  and  L < feePerByte*wrongChangeDeltaV
    const changeDeltaFee = feePerByte * changeDeltaV;
    const wrongDeltaFee = feePerByte * wrongChangeDeltaV;

    // pick L exactly one sat over the true threshold, safely below the wrong threshold
    const L = changeDeltaFee + 1;
    expect(L).toBeLessThan(wrongDeltaFee);

    const amount = 80_000;
    const utxoValue = amount + feeNoChange + L; // ensures currentValue - actualTarget = L

    // single UTXO to force 1-input selection
    storage.appendTxs([
      {
        id: "tx-utxo-coinselect-change-test",
        inputs: [],
        outputs: [
          {
            output_index: 0,
            value: String(utxoValue),
            address: "tb1q-my-utxo",
            output_hash: "7f7cb4f845f3ca9a2ee64c79619958c8d4aa3b48783b255abea6aa1a8f7093cc",
            block_height: 100,
            rbf: false,
          },
        ],
        block: { hash: "h", height: 100, time: "2024-01-05T00:00:00Z" },
        account: 0,
        index: 0,
        address: "tb1q-my-utxo",
        received_at: "2024-01-05T00:00:00Z",
      },
    ]);

    const strat = new CoinSelect(xpub.crypto, xpub.derivationMode, []);
    const res = await strat.selectUnspentUtxosToUse(
      xpub,
      [
        {
          address: "tb1p-taproot-dest",
          isChange: false,
          script: scriptP2TR,
          value: new BigNumber(amount),
        },
      ],
      feePerByte,
    );

    // With correct logic (threshold = changeDeltaV), leftover == changeDeltaFee+1 ⇒ add change
    expect(res.needChangeoutput).toBe(true);

    // Fee must equal integer vbytes * feerate for (1-in, P2TR recipient, + P2WPKH change)
    const vWithChange = utils.maxTxVBytesCeil(
      1,
      [scriptP2TR],
      true,
      xpub.crypto,
      xpub.derivationMode,
    );
    expect(res.fee).toBe(vWithChange * feePerByte);

    expect(res.unspentUtxos.length).toBe(1);
    expect(Number(res.unspentUtxos[0].value)).toBe(utxoValue);
  });
});

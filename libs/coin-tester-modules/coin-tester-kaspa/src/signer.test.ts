import { computeInputSighash, type TxForSighash } from "./signer";

// Ground truth for these fixtures isn't a literal vector published by rusty-kaspa (its own
// sighash.rs test suite is differential — it only checks that changing a field changes the
// hash, not fixed input/output values) — it's captured from a real transaction that a real
// kaspad node accepted during scenarii.test.ts. Schnorr verification requires an exact message
// match, so kaspad accepting the broadcast is strong evidence computeInputSighash's byte layout
// matches rusty-kaspa's calc_schnorr_signature_hash() exactly; a wrong field order/width would
// have produced a different hash, an invalid signature, and a rejected broadcast instead.
describe("computeInputSighash", () => {
  it("matches a kaspad-accepted sighash for a 3-input consolidation (index 0)", () => {
    const tx: TxForSighash = {
      version: 0,
      inputs: [
        {
          prevTxId: "4a7e3811e34301c583155b2237764f4f525e80ee706912fa8d7676caa525541b",
          outpointIndex: 0,
          value: 5000000000,
        },
        {
          prevTxId: "81844aa1ea2cc95bc84ae92eebc111996dae4fcbabe45e0b7fd566a8d64b213b",
          outpointIndex: 0,
          value: 5000000000,
        },
        {
          prevTxId: "213e36a47771cf5bb3744cdb568dec0c8be334d5c08cee3278a07fb7542c6464",
          outpointIndex: 0,
          value: 5000000000,
        },
      ],
      outputs: [
        {
          value: 10000000000,
          scriptPublicKey: "2089e1a064d54a60ff5814a29c8cdfc9ff0a666b7e51129b97df25c0be5f740114ac",
        },
        {
          value: 4999572800,
          scriptPublicKey: "201bacea84ca721c95d67ecace19bc499a77c03726bc8739af637bcd89abaaf058ac",
        },
      ],
    };
    const script = "201bacea84ca721c95d67ecace19bc499a77c03726bc8739af637bcd89abaaf058ac";

    const sighash = computeInputSighash(tx, 0, script);

    expect(Buffer.from(sighash).toString("hex")).toBe(
      "45495078a434877433fd77a9316fd2c3d6eff188196376677383b193ca2e0f5e",
    );
  });

  it("matches a kaspad-accepted sighash for a 5-input consolidation, non-zero input index (index 1)", () => {
    const tx: TxForSighash = {
      version: 0,
      inputs: [
        {
          prevTxId: "9bb5719bb7c60afa2742c254730be81ecc47d8befea4dd6283f9324ad1ff8dac",
          outpointIndex: 0,
          value: 5000427200,
        },
        {
          prevTxId: "d9ff54964b8fbdc44d318c0e9e2a771f0404f3293e728c8fcb503ec1637aadb0",
          outpointIndex: 0,
          value: 5000000000,
        },
        {
          prevTxId: "0424933c1d2bc8e5cf463a1098f914969b9e7498c9e491443498729ed1308161",
          outpointIndex: 0,
          value: 5000000000,
        },
        {
          prevTxId: "c01ef72d365515914535790342fa18f3e3bc181f0a521ab691b6670e7351d850",
          outpointIndex: 0,
          value: 5000650800,
        },
        {
          prevTxId: "68799a07790bce275bbb61b57bd661987d6294d88ba0b345dfe96b5f5601312e",
          outpointIndex: 0,
          value: 5000000000,
        },
      ],
      outputs: [
        {
          value: 20000000000,
          scriptPublicKey: "2089e1a064d54a60ff5814a29c8cdfc9ff0a666b7e51129b97df25c0be5f740114ac",
        },
        {
          value: 5000427200,
          scriptPublicKey: "201bacea84ca721c95d67ecace19bc499a77c03726bc8739af637bcd89abaaf058ac",
        },
      ],
    };
    const script = "201bacea84ca721c95d67ecace19bc499a77c03726bc8739af637bcd89abaaf058ac";

    const sighash = computeInputSighash(tx, 1, script);

    expect(Buffer.from(sighash).toString("hex")).toBe(
      "dd5177df557f4f6ff1e214192128b96b2d8fa537f1647f7c8af99557bd7bfcce",
    );
  });

  // Mirrors rusty-kaspa's own sighash.rs differential test: every field that feeds the preimage
  // must actually change the resulting hash, otherwise it isn't being committed to at all.
  it("changes when any signed field changes", () => {
    const base: TxForSighash = {
      version: 0,
      inputs: [
        {
          prevTxId: "4a7e3811e34301c583155b2237764f4f525e80ee706912fa8d7676caa525541b",
          outpointIndex: 0,
          value: 5000000000,
        },
      ],
      outputs: [
        {
          value: 4999000000,
          scriptPublicKey: "201bacea84ca721c95d67ecace19bc499a77c03726bc8739af637bcd89abaaf058ac",
        },
      ],
    };
    const script = "201bacea84ca721c95d67ecace19bc499a77c03726bc8739af637bcd89abaaf058ac";
    const baseline = Buffer.from(computeInputSighash(base, 0, script)).toString("hex");

    const variants: TxForSighash[] = [
      { ...base, version: 1 },
      { ...base, inputs: [{ ...base.inputs[0], outpointIndex: 1 }] },
      { ...base, inputs: [{ ...base.inputs[0], value: base.inputs[0].value + 1 }] },
      { ...base, outputs: [{ ...base.outputs[0], value: base.outputs[0].value + 1 }] },
    ];
    for (const variant of variants) {
      expect(Buffer.from(computeInputSighash(variant, 0, script)).toString("hex")).not.toBe(
        baseline,
      );
    }

    // Same tx, different script public key for the input being signed — the script is part of
    // the preimage per-input, not just the tx.
    const otherScript = "2089e1a064d54a60ff5814a29c8cdfc9ff0a666b7e51129b97df25c0be5f740114ac";
    expect(Buffer.from(computeInputSighash(base, 0, otherScript)).toString("hex")).not.toBe(
      baseline,
    );
  });
});

import * as btc from "bitcoinjs-lib";

const RBF_SEQUENCE = 0xfffffffd; // RBF-enabled sequence

export type RbfFixtureParams = {
  externalRecipient: string;
  changeAddress: string;
  amountToExternal: number;
  changeAmount: number;
  fundingOutputValue: number;
};

export type RbfFixtureResult = {
  fundingTxHex: string;
  fundingTxIdHex: string;
  rbfTxHex: string;
  originalTxId: string;
  network: btc.Network;
  /** Speedup tx: same inputs/outputs as original but 1 sat less change (higher fee) → different txid */
  speedupTxHex: string;
  speedupTxId: string;
  /** Cancel tx: same input as original, single output to change (funding - fee back to self) */
  cancelTxHex: string;
  cancelTxId: string;
};

/**
 * Build a minimal funding tx (one output) and an RBF child tx (one input, two outputs).
 * Also builds speedup tx and cancel tx for "cancel the cancel" / "speed up then cancel" tests.
 * Used to mock explorer.getTxHex in RBF integration tests.
 */
export function buildRbfFixtureTxs({
  externalRecipient,
  changeAddress,
  amountToExternal,
  changeAmount,
  fundingOutputValue,
}: RbfFixtureParams): RbfFixtureResult {
  const network = btc.networks.bitcoin;

  const fundingTx = new btc.Transaction();
  fundingTx.version = 2;
  fundingTx.addInput(Buffer.alloc(32, 0), 0, 0xffffffff);
  fundingTx.addOutput(btc.address.toOutputScript(changeAddress, network), fundingOutputValue);
  const fundingTxHex = fundingTx.toHex();
  const fundingTxIdHex = fundingTx.getId();

  const rbfTx = new btc.Transaction();
  rbfTx.version = 2;
  rbfTx.addInput(Buffer.from(fundingTxIdHex, "hex").reverse(), 0, RBF_SEQUENCE);
  rbfTx.addOutput(btc.address.toOutputScript(externalRecipient, network), amountToExternal);
  rbfTx.addOutput(btc.address.toOutputScript(changeAddress, network), changeAmount);
  const originalTxId = rbfTx.getId();
  const rbfTxHex = rbfTx.toHex();

  // Speedup: same inputs/outputs, 1 sat less change → different txid
  const speedupTx = new btc.Transaction();
  speedupTx.version = 2;
  speedupTx.addInput(Buffer.from(fundingTxIdHex, "hex").reverse(), 0, RBF_SEQUENCE);
  speedupTx.addOutput(btc.address.toOutputScript(externalRecipient, network), amountToExternal);
  speedupTx.addOutput(btc.address.toOutputScript(changeAddress, network), changeAmount - 1);
  const speedupTxId = speedupTx.getId();
  const speedupTxHex = speedupTx.toHex();

  // Cancel: same input, single output to change
  const cancelFeeSat = 5000;
  const cancelTx = new btc.Transaction();
  cancelTx.version = 2;
  cancelTx.addInput(Buffer.from(fundingTxIdHex, "hex").reverse(), 0, RBF_SEQUENCE);
  cancelTx.addOutput(
    btc.address.toOutputScript(changeAddress, network),
    fundingOutputValue - cancelFeeSat,
  );
  const cancelTxId = cancelTx.getId();
  const cancelTxHex = cancelTx.toHex();

  return {
    fundingTxHex,
    fundingTxIdHex,
    rbfTxHex,
    originalTxId,
    network,
    speedupTxHex,
    speedupTxId,
    cancelTxHex,
    cancelTxId,
  };
}

/**
 * Two-UTXO fixture: two funding txs, one RBF tx spending both (multiple inputs).
 */
export function buildRbfFixtureTxsWithTwoUtxos({
  externalRecipient,
  changeAddress,
  amountToExternal,
  changeAmount,
  fundingOutputValue1,
  fundingOutputValue2,
}: {
  externalRecipient: string;
  changeAddress: string;
  amountToExternal: number;
  changeAmount: number;
  fundingOutputValue1: number;
  fundingOutputValue2: number;
}): {
  fundingTx1Hex: string;
  fundingTx1IdHex: string;
  fundingTx2Hex: string;
  fundingTx2IdHex: string;
  rbfTxHex: string;
  originalTxId: string;
  network: btc.Network;
} {
  const network = btc.networks.bitcoin;

  const fundingTx1 = new btc.Transaction();
  fundingTx1.version = 2;
  fundingTx1.addInput(Buffer.alloc(32, 0), 0, 0xffffffff);
  fundingTx1.addOutput(btc.address.toOutputScript(changeAddress, network), fundingOutputValue1);
  const fundingTx1Hex = fundingTx1.toHex();
  const fundingTx1IdHex = fundingTx1.getId();

  const fundingTx2 = new btc.Transaction();
  fundingTx2.version = 2;
  fundingTx2.addInput(Buffer.alloc(32, 1), 0, 0xffffffff);
  fundingTx2.addOutput(btc.address.toOutputScript(changeAddress, network), fundingOutputValue2);
  const fundingTx2Hex = fundingTx2.toHex();
  const fundingTx2IdHex = fundingTx2.getId();

  const rbfTx = new btc.Transaction();
  rbfTx.version = 2;
  rbfTx.addInput(Buffer.from(fundingTx1IdHex, "hex").reverse(), 0, RBF_SEQUENCE);
  rbfTx.addInput(Buffer.from(fundingTx2IdHex, "hex").reverse(), 0, RBF_SEQUENCE);
  rbfTx.addOutput(btc.address.toOutputScript(externalRecipient, network), amountToExternal);
  rbfTx.addOutput(btc.address.toOutputScript(changeAddress, network), changeAmount);
  const originalTxId = rbfTx.getId();
  const rbfTxHex = rbfTx.toHex();

  return {
    fundingTx1Hex,
    fundingTx1IdHex,
    fundingTx2Hex,
    fundingTx2IdHex,
    rbfTxHex,
    originalTxId,
    network,
  };
}

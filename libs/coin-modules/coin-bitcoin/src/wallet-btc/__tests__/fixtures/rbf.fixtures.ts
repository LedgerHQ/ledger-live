import * as btc from "bitcoinjs-lib";

const RBF_SEQUENCE = 0xfffffffd; // RBF-enabled sequence

/**
 * Build a minimal funding tx (one output) and an RBF child tx (one input, two outputs).
 * Used to mock explorer.getTxHex in RBF integration tests.
 */
export function buildRbfFixtureTxs({
  externalRecipient,
  changeAddress,
  amountToExternal,
  changeAmount,
  fundingOutputValue,
}: {
  externalRecipient: string;
  changeAddress: string;
  amountToExternal: number;
  changeAmount: number;
  fundingOutputValue: number;
}): {
  fundingTxHex: string;
  /** Standard txid (hex) of the funding tx – used by getTxHex mock for parent lookup */
  fundingTxIdHex: string;
  rbfTxHex: string;
  originalTxId: string;
  network: btc.Network;
} {
  const network = btc.networks.bitcoin;

  // Funding tx must have at least one input so fromHex() parses it correctly
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

  return {
    fundingTxHex,
    fundingTxIdHex,
    rbfTxHex,
    originalTxId,
    network,
  };
}

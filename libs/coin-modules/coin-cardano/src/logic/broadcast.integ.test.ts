import { randomBytes } from "crypto";
import { Bip32PrivateKey } from "@stricahq/bip32ed25519";
import {
  Transaction as TyphonTransaction,
  address as TyphonAddress,
  types as TyphonTypes,
} from "@stricahq/typhonjs";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import BigNumber from "bignumber.js";
import { broadcast } from "./broadcast";

// Real-backend submit against Cardano preprod (CARDANO_TESTNET_API_ENDPOINT). We build and
// software-sign a well-formed transaction that spends a nonexistent UTXO, then submit it through
// the CoinModule broadcast: the node must reject it (the input isn't in its UTxO set). This
// exercises the testnet endpoint + the real submit path end-to-end without secrets or funds —
// a funded round-trip would need a faucet-seeded key in CI secrets, which is out of scope here.
describe("broadcast (alpaca, preprod)", () => {
  it("rejects a well-formed transaction spending a nonexistent input", async () => {
    const currency = getCryptoCurrencyById("cardano_testnet");

    const privKey = await Bip32PrivateKey.fromEntropy(randomBytes(64));
    const pubKeyBytes = privKey.toBip32PublicKey().toPublicKey().toBytes();

    const address = new TyphonAddress.EnterpriseAddress(TyphonTypes.NetworkId.TESTNET, {
      type: TyphonTypes.HashType.ADDRESS,
      hash: randomBytes(28),
    });
    // Zero-fee params so the tx builds without funding math; only fee-relevant fields matter here.
    const protocolParams: TyphonTypes.ProtocolParams = {
      minFeeA: new BigNumber(0),
      minFeeB: new BigNumber(0),
      stakeKeyDeposit: new BigNumber(0),
      lovelacePerUtxoWord: new BigNumber(0),
      utxoCostPerByte: new BigNumber(0),
      collateralPercent: new BigNumber(0),
      priceSteps: new BigNumber(0),
      priceMem: new BigNumber(0),
      languageView: { PlutusScriptV1: [], PlutusScriptV2: [], PlutusScriptV3: [] },
      maxValueSize: 0,
      minFeeRefScriptCostPerByte: new BigNumber(0),
    };
    const typhonTx = new TyphonTransaction({ protocolParams });
    const finalTx = typhonTx.paymentTransaction({
      inputs: [{ txId: "a".repeat(64), index: 0, amount: new BigNumber(1), tokens: [], address }],
      outputs: [],
      changeAddress: address,
      ttl: 0,
    });

    const txHash = finalTx.getTransactionHash();
    finalTx.addWitness({
      publicKey: Buffer.from(pubKeyBytes),
      signature: privKey.toPrivateKey().sign(txHash),
    });

    const { payload } = finalTx.buildTransaction();

    // The preprod node returns 400 "tx submission failed" — a real validation rejection, not a
    // transport blip, so matching the message keeps the test from passing on an unreachable endpoint.
    await expect(broadcast(currency, { signature: payload })).rejects.toThrow(
      /tx submission failed/,
    );
  });
});

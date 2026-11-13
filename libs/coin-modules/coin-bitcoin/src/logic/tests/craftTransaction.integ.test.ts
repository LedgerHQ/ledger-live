import { Psbt, address as btcAddress } from "bitcoinjs-lib";
import { bitcoinDefaults, type BitcoinContext } from "../../config";
import { craftTransaction } from "../craftTransaction";
import { FUNDED_P2WPKH, PRISTINE_P2PKH } from "./helpers/fixtures";

const context: BitcoinContext = {
  config: async () => bitcoinDefaults.bitcoin,
  logger: () => {},
};

const intent = {
  intentType: "transaction" as const,
  type: "send",
  sender: FUNDED_P2WPKH,
  recipient: PRISTINE_P2PKH,
  amount: 1_000n,
  asset: { type: "native" as const },
};

describe("craftTransaction (mainnet)", () => {
  it("crafts a send with the amount and recipient", async () => {
    const psbt = Psbt.fromBase64((await craftTransaction(context, "bitcoin", intent)).transaction);
    expect(psbt.txOutputs[0].value).toBe(1_000n);
    expect(Buffer.from(psbt.txOutputs[0].script)).toEqual(
      Buffer.from(btcAddress.toOutputScript(PRISTINE_P2PKH)),
    );
    expect(psbt.data.inputs[0].nonWitnessUtxo?.length).toBeGreaterThan(0);
  });

  it("crafts a send-max with the whole balance minus the fee", async () => {
    const crafted = await craftTransaction(context, "bitcoin", { ...intent, useAllAmount: true });
    const psbt = Psbt.fromBase64(crafted.transaction);
    expect(psbt.txOutputs).toHaveLength(1);
    expect(BigInt(psbt.txOutputs[0].value) + (crafted.details?.fee as bigint)).toBe(9_623n);
  });
});

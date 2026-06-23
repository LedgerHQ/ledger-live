// Mint a native token on the Yaci devnet — coin-cardano's craft only *sends* existing tokens and the
// faucet is ADA-only, so the tester mints its own test asset via a one-time Typhon tx. The policy is a
// simple sig native-script (mint authorized by the account's payment key), so its id is deterministic
// for the fixed test mnemonic and the same key signs both the input spend and the mint.
import { getProtocolParamsFixture } from "@ledgerhq/coin-cardano/fixtures/protocolParams";
import { getTTL } from "@ledgerhq/coin-cardano/logic";
import { extractPaymentKeyFromAddress } from "@ledgerhq/coin-cardano/utils";
import {
  NativeScriptFactory,
  Transaction as TyphonTransaction,
  types as TyphonTypes,
  utils as TyphonUtils,
} from "@stricahq/typhonjs";
import BigNumber from "bignumber.js";
import { Buffer } from "buffer";
import { YACI_STORE_API } from "./yaci";
import type { CardanoTesterSigner } from "./signer";

// Upper bound used only to size the token output's min-UTXO (mirrors coin-cardano craftTransaction).
const CARDANO_MAX_SUPPLY = 45e9;

function nativeScriptFor(address: string): TyphonTypes.NativeScript {
  return { pubKeyHash: extractPaymentKeyFromAddress(address) };
}

/** Deterministic policy id for the account's sig policy — used to build the token's asset reference. */
export function computePolicyId(address: string): string {
  return new NativeScriptFactory(nativeScriptFor(address)).policyId().toString("hex");
}

function toTyphonProtocolParams(): TyphonTypes.ProtocolParams {
  const pp = getProtocolParamsFixture();
  return {
    minFeeA: new BigNumber(pp.minFeeA),
    minFeeB: new BigNumber(pp.minFeeB),
    stakeKeyDeposit: new BigNumber(pp.stakeKeyDeposit),
    lovelacePerUtxoWord: new BigNumber(pp.lovelacePerUtxoWord),
    collateralPercent: new BigNumber(pp.collateralPercent),
    priceSteps: new BigNumber(pp.priceSteps),
    priceMem: new BigNumber(pp.priceMem),
    languageView: pp.languageView,
    maxTxSize: Number(pp.maxTxSize),
    maxValueSize: Number(pp.maxValueSize),
    utxoCostPerByte: new BigNumber(pp.utxoCostPerByte),
    minFeeRefScriptCostPerByte: new BigNumber(pp.minFeeRefScriptCostPerByte),
  };
}

type YaciUtxo = {
  tx_hash: string;
  output_index: number;
  amount: { unit: string; quantity: string }[];
};

async function pureAdaUtxo(address: string): Promise<YaciUtxo> {
  const utxos: YaciUtxo[] = await (
    await fetch(`${YACI_STORE_API}/addresses/${address}/utxos`)
  ).json();
  const utxo = utxos.find(u => u.amount.length === 1 && u.amount[0].unit === "lovelace");
  if (!utxo)
    throw new Error("mintToken: no pure-ADA UTXO to fund the mint (topup the address first)");
  return utxo;
}

/**
 * Mint `amount` of `<computePolicyId(address)>.<assetNameHex>` to `address` and submit to the devnet.
 * Returns the minted asset reference (`<policyId><assetNameHex>`).
 */
export async function mintToken(params: {
  address: string;
  derivationPath: string;
  signer: CardanoTesterSigner;
  networkId: number;
  currencyId: string;
  assetNameHex: string;
  amount: bigint;
}): Promise<string> {
  const { address, derivationPath, signer, networkId, currencyId, assetNameHex, amount } = params;
  const nativeScript = nativeScriptFor(address);
  const policyId = new NativeScriptFactory(nativeScript).policyId().toString("hex");
  const senderAddress = TyphonUtils.getAddressFromString(address) as TyphonTypes.ShelleyAddress;
  const protocolParams = toTyphonProtocolParams();

  const utxo = await pureAdaUtxo(address);
  const input: TyphonTypes.Input = {
    txId: utxo.tx_hash,
    index: utxo.output_index,
    amount: new BigNumber(utxo.amount[0].quantity),
    tokens: [],
    address: senderAddress,
  };

  const token: TyphonTypes.Token = {
    policyId,
    assetName: assetNameHex,
    amount: new BigNumber(amount.toString()),
  };
  const tx = new TyphonTransaction({ protocolParams });
  tx.setTTL(getTTL(currencyId));
  tx.addMint({
    policyId,
    assets: [{ assetName: assetNameHex, amount: token.amount }],
    nativeScript,
  });
  tx.addOutput({
    address: senderAddress,
    amount: TyphonUtils.calculateMinUtxoAmountBabbage(
      { address: senderAddress, amount: new BigNumber(CARDANO_MAX_SUPPLY), tokens: [token] },
      protocolParams.utxoCostPerByte,
    ),
    tokens: [token],
  });
  const prepared = tx.prepareTransaction({ inputs: [input], changeAddress: senderAddress });

  const unsigned = prepared.buildTransaction().payload;
  const signatureHex = await signer.signTransaction(derivationPath, unsigned);
  const { publicKey } = await signer.getAddress(derivationPath, networkId);
  prepared.addWitness({
    signature: Buffer.from(signatureHex, "hex"),
    publicKey: Buffer.from(publicKey, "hex"),
  });

  const res = await fetch(`${YACI_STORE_API}/tx/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/cbor" },
    body: Buffer.from(prepared.buildTransaction().payload, "hex"),
  });
  if (!res.ok) throw new Error(`mintToken: submit failed ${res.status} ${await res.text()}`);

  return `${policyId}${assetNameHex}`;
}

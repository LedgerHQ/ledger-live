import type {
  AssetInfo,
  CraftedTransaction,
  FeeEstimation,
  StakingTransactionIntent,
  StringMemo,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import {
  Transaction as TyphonTransaction,
  address as TyphonAddress,
  types as TyphonTypes,
  utils as TyphonUtils,
} from "@stricahq/typhonjs";
import BigNumber from "bignumber.js";
import { getAllTransactionsByKeys } from "../api/fetchTransactions";
import { getDelegationInfo } from "../api/getDelegationInfo";
import { fetchNetworkInfo } from "../api/getNetworkInfo";
import { CARDANO_MAX_SUPPLY, MEMO_LABEL } from "../constants";
import { type DerivedUtxo, deriveUtxos, getTTL, isTestnet, mergeTokens } from "../logic";
import { CardanoDelegation, ProtocolParams } from "../types";
import {
  EMPTY_CREDENTIAL_KEY,
  extractPaymentKeyFromAddress,
  extractStakeKeyFromAddress,
} from "../utils";

function toTyphonProtocolParams(pp: ProtocolParams): TyphonTypes.ProtocolParams {
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

/**
 * The CoinModule API receives only the sender address (no xpub), so all inputs share the
 * sender's payment credential. Using the sender address as each input's address yields the
 * correct payment credential for Typhon's required-witness tracking; the BIP path (signing
 * metadata) is intentionally absent and supplied later by the device-signing step.
 */
function toTyphonInput(
  utxo: DerivedUtxo,
  senderAddress: TyphonTypes.ShelleyAddress,
): TyphonTypes.Input {
  return {
    txId: utxo.txId,
    index: utxo.index,
    amount: utxo.amount,
    tokens: utxo.tokens,
    address: senderAddress,
  };
}

/**
 * Parse a token asset reference into its parts. Matches the canonical Cardano asset id
 * (getTokenAssetId in buildSubAccounts, also emitted by getBalance): the 28-byte (56 hex char)
 * policy id concatenated with the asset name, no separator. The asset name is 0–32 bytes of hex
 * (empty is valid). Rejects malformed references up front rather than letting Typhon fail
 * opaquely or craft the wrong asset.
 */
function parseTokenAssetReference(asset: AssetInfo): { policyId: string; assetName: string } {
  const reference = (asset as { assetReference?: string }).assetReference ?? "";
  const policyId = reference.slice(0, 56);
  const assetName = reference.slice(56);
  if (
    !/^[0-9a-fA-F]{56}$/.test(policyId) ||
    !/^[0-9a-fA-F]*$/.test(assetName) ||
    assetName.length % 2 !== 0 ||
    assetName.length > 64
  ) {
    throw new Error("Invalid token asset reference");
  }
  return { policyId, assetName };
}

function stakeHashCredential(stakeKey: string): TyphonTypes.HashCredential {
  return {
    hash: Buffer.from(stakeKey, "hex"),
    type: TyphonTypes.HashType.ADDRESS,
  };
}

/**
 * Account-level obligations that the legacy builder attaches to every transaction:
 * sweep claimable rewards (only withdrawable once delegated to a dRep — Conway rule) and,
 * when rewards exist but no dRep is set, add the ABSTAIN vote-delegation certificate the
 * Conway era requires before such a transaction is valid.
 */
function addAccountObligations(
  typhonTx: TyphonTransaction,
  currency: CryptoCurrency,
  stakeKey: string,
  delegation: CardanoDelegation,
): void {
  const rewards = delegation.rewards ?? new BigNumber(0);
  if (rewards.lte(0)) return;

  const stakeCredential = stakeHashCredential(stakeKey);
  const networkId = isTestnet(currency)
    ? TyphonTypes.NetworkId.TESTNET
    : TyphonTypes.NetworkId.MAINNET;

  if (delegation.dRepHex) {
    typhonTx.addWithdrawal({
      rewardAccount: new TyphonAddress.RewardAddress(networkId, stakeCredential),
      amount: rewards,
    });
  } else {
    const abstainDRep: TyphonTypes.DRep = { type: TyphonTypes.DRepType.ABSTAIN, key: undefined };
    typhonTx.addCertificate({
      type: TyphonTypes.CertificateType.VOTE_DELEGATION,
      cert: { stakeCredential, dRep: abstainDRep },
    });
  }
}

function addStakingCertificates(
  typhonTx: TyphonTransaction,
  intent: StakingTransactionIntent<StringMemo>,
  protocolParams: ProtocolParams,
  stakeKey: string,
  delegation: CardanoDelegation | undefined,
): void {
  const stakeCredential = stakeHashCredential(stakeKey);

  if (intent.mode === "delegate") {
    if (!intent.valAddress) throw new Error("Missing pool id for delegation");

    if (!delegation?.status) {
      typhonTx.addCertificate({
        type: TyphonTypes.CertificateType.STAKE_KEY_REGISTRATION,
        cert: {
          stakeCredential,
          deposit: new BigNumber(protocolParams.stakeKeyDeposit),
        },
      });
    }

    typhonTx.addCertificate({
      type: TyphonTypes.CertificateType.STAKE_DELEGATION,
      cert: { stakeCredential, poolHash: intent.valAddress },
    });
    return;
  }

  if (intent.mode === "undelegate") {
    if (!delegation?.status) {
      throw new Error("Stake key is not registered");
    }
    typhonTx.addCertificate({
      type: TyphonTypes.CertificateType.STAKE_KEY_DE_REGISTRATION,
      cert: {
        stakeCredential,
        deposit: new BigNumber(delegation.deposit || 0),
      },
    });
    return;
  }

  throw new Error(`Unsupported staking mode: ${intent.mode}`);
}

/**
 * Add the output(s) for a native ADA send and return the change address. A send-all routes the
 * remaining ADA to the recipient (via change) while keeping any tokens the sender holds on the
 * sender — a max-ADA send must not transfer them. A fixed-amount send adds an explicit recipient
 * output and change returns to the sender. Mirrors the legacy buildSendAdaTransaction behaviour.
 */
function addNativeOutputs(
  typhonTx: TyphonTransaction,
  intent: TransactionIntent<StringMemo>,
  senderAddress: TyphonTypes.ShelleyAddress,
  inputs: TyphonTypes.Input[],
  protocolParams: ProtocolParams,
): TyphonTypes.CardanoAddress {
  if (intent.useAllAmount) {
    const heldTokens = mergeTokens(inputs.flatMap(i => i.tokens));
    if (heldTokens.length) {
      typhonTx.addOutput({
        address: senderAddress,
        amount: TyphonUtils.calculateMinUtxoAmountBabbage(
          { address: senderAddress, amount: new BigNumber(CARDANO_MAX_SUPPLY), tokens: heldTokens },
          new BigNumber(protocolParams.utxoCostPerByte),
        ),
        tokens: heldTokens,
      });
    }
    return TyphonUtils.getAddressFromString(intent.recipient);
  }

  if (intent.amount <= 0n) throw new Error("Transaction amount must be positive");
  const recipientAddress = TyphonUtils.getAddressFromString(intent.recipient);
  const amount = new BigNumber(intent.amount.toString());
  // Every Cardano output must hold at least the Babbage min-UTXO for its size; an amount below
  // that floor crafts a body the node rejects. Fail early with a clear error instead.
  const minAda = TyphonUtils.calculateMinUtxoAmountBabbage(
    { address: recipientAddress, amount: new BigNumber(CARDANO_MAX_SUPPLY), tokens: [] },
    new BigNumber(protocolParams.utxoCostPerByte),
  );
  if (amount.lt(minAda)) {
    throw new Error("Transaction amount is below the minimum required for an output");
  }
  typhonTx.addOutput({ address: recipientAddress, amount, tokens: [] });
  return senderAddress;
}

/**
 * Add the multiasset output for a token transfer: the recipient receives the requested token
 * plus the minimum ADA required to carry it. On `useAllAmount` the full held balance of that
 * token (summed across the sender's UTXOs) is sent — Typhon then pulls every token-bearing UTXO
 * to cover the output and returns the leftover ADA (and any other tokens) to the sender as change.
 */
function addTokenOutput(
  typhonTx: TyphonTransaction,
  intent: TransactionIntent<StringMemo>,
  inputs: TyphonTypes.Input[],
  protocolParams: ProtocolParams,
): void {
  const { policyId, assetName } = parseTokenAssetReference(intent.asset);
  const heldAmount =
    mergeTokens(inputs.flatMap(i => i.tokens)).find(
      t => t.policyId === policyId && t.assetName === assetName,
    )?.amount ?? new BigNumber(0);
  const amount = intent.useAllAmount ? heldAmount : new BigNumber(intent.amount.toString());
  if (amount.lte(0)) {
    throw new Error(
      intent.useAllAmount
        ? "Sender holds none of the requested token"
        : "Transaction amount must be positive",
    );
  }
  const receiverAddress = TyphonUtils.getAddressFromString(intent.recipient);
  const tokens: TyphonTypes.Token[] = [{ policyId, assetName, amount }];
  const requiredMinAda = TyphonUtils.calculateMinUtxoAmountBabbage(
    { address: receiverAddress, amount: new BigNumber(CARDANO_MAX_SUPPLY), tokens },
    new BigNumber(protocolParams.utxoCostPerByte),
  );
  typhonTx.addOutput({ address: receiverAddress, amount: requiredMinAda, tokens });
}

/**
 * Reconcile a user-supplied fee against the fee Typhon estimated while balancing the
 * transaction. The fee difference is absorbed by the change output (the last output, which
 * Typhon appends as change), keeping inputs = outputs + fee. Throws when the custom fee is
 * below the protocol minimum, when there is no change output to absorb the difference, or
 * when doing so would push that output below the min-UTXO floor.
 */
function applyCustomFee(
  typhonTx: TyphonTransaction,
  baseOutputCount: number,
  customFee: BigNumber,
): void {
  // Typhon's estimate is the protocol minimum fee for this tx size; a lower custom fee would
  // balance arithmetically but be rejected on-chain, so refuse it rather than craft a dud.
  const estimatedFee = typhonTx.getFee();
  if (customFee.eq(estimatedFee)) return;
  if (customFee.lt(estimatedFee)) {
    throw new Error("Custom fee is below the minimum required fee");
  }

  const outputs = typhonTx.getOutputs();
  if (outputs.length <= baseOutputCount) {
    throw new Error("Cannot apply custom fee: transaction has no change output");
  }

  const changeOutput = outputs[outputs.length - 1];
  const delta = customFee.minus(estimatedFee);
  const newAmount = changeOutput.amount.minus(delta);
  const minUtxo = typhonTx.calculateMinUtxoAmountBabbage(changeOutput);
  if (newAmount.lt(minUtxo)) {
    throw new Error("Custom fee too high: change output would fall below the min-UTXO amount");
  }

  changeOutput.amount = newAmount;
  typhonTx.setFee(customFee);
}

/**
 * Build the unsigned Typhon transaction for a CoinModule intent (native ADA, token, or
 * staking delegate/undelegate). Inputs are the sender address's UTXOs and change returns to
 * the sender. Per-input BIP paths required by the device are signing metadata added
 * downstream, not part of this body — so no xpub/account sync is needed here.
 */
export async function buildUnsignedTransaction(
  currency: CryptoCurrency,
  intent: TransactionIntent<StringMemo>,
  customFees?: FeeEstimation,
): Promise<TyphonTransaction> {
  const paymentKey = extractPaymentKeyFromAddress(intent.sender);
  if (paymentKey === EMPTY_CREDENTIAL_KEY) {
    throw new Error("Unsupported sender address");
  }
  // Carried by the sender address; needed for the delegation fetch and Conway obligations below.
  const stakeKey = extractStakeKeyFromAddress(intent.sender);

  // Protocol params, the sender's tx history (for UTXOs) and the delegation state are independent
  // network calls — fetch them in parallel rather than serially.
  const [{ protocolParams }, { transactions }, delegation] = await Promise.all([
    fetchNetworkInfo(currency),
    getAllTransactionsByKeys([paymentKey], 0, currency),
    stakeKey ? getDelegationInfo(currency, stakeKey) : Promise.resolve(undefined),
  ]);

  const typhonTx = new TyphonTransaction({
    protocolParams: toTyphonProtocolParams(protocolParams),
  });
  typhonTx.setTTL(getTTL(currency.id));

  const memo = "memo" in intent && intent.memo?.type === "string" ? intent.memo.value : undefined;
  if (memo) {
    typhonTx.setAuxiliaryData({
      metadata: [{ label: MEMO_LABEL, data: new Map([["msg", [memo]]]) }],
    });
  }

  const senderAddress = TyphonUtils.getAddressFromString(
    intent.sender,
  ) as TyphonTypes.ShelleyAddress;
  // Derived from confirmed history only — with just an address (no pending-operation state) two
  // craft calls before the first broadcast confirms may select the same UTXO. Same single-address
  // constraint as getBalance/listOperations.
  const inputs = deriveUtxos(transactions, paymentKey).map(u => toTyphonInput(u, senderAddress));
  if (!inputs.length) {
    throw new Error("No spendable UTXOs for sender address");
  }

  // Account-level reward/vote obligations (Conway) plus, for staking, the certificates;
  // both require the stake credential carried by the sender address.
  if (stakeKey && delegation) {
    addAccountObligations(typhonTx, currency, stakeKey, delegation);
  }

  // changeAddress is the sender for sends/staking; for a send-all it is the recipient, so the
  // entire balance (minus fee) lands there with no explicit recipient output.
  let changeAddress: TyphonTypes.CardanoAddress = senderAddress;

  if (intent.intentType === "staking") {
    if (!stakeKey) throw new Error("Sender address has no stake credential");
    addStakingCertificates(
      typhonTx,
      intent as StakingTransactionIntent<StringMemo>,
      protocolParams,
      stakeKey,
      delegation,
    );
  } else if (intent.asset.type === "native") {
    changeAddress = addNativeOutputs(typhonTx, intent, senderAddress, inputs, protocolParams);
  } else {
    addTokenOutput(typhonTx, intent, inputs, protocolParams);
  }

  // Spend the largest UTXOs first so Typhon's coin selection covers the outputs with the fewest
  // inputs (smaller tx, lower fee) — mirrors the legacy builder's largest-first ordering.
  inputs.sort((a, b) => b.amount.comparedTo(a.amount));

  // A max-ADA native send must spend the ENTIRE UTXO set. Typhon's prepareTransaction does
  // minimal coin selection over the inputs it is given (it stops as soon as the outputs + fee are
  // covered), so for a sweep we force every UTXO as a mandatory input and hand it nothing to
  // select — all remaining ADA then lands in the change output (whose address is the recipient).
  // Every other intent lets Typhon select the minimal set from the available inputs.
  const sweepAll =
    intent.intentType === "transaction" && intent.asset.type === "native" && !!intent.useAllAmount;
  if (sweepAll) {
    inputs.forEach(input => typhonTx.addInput(input));
  }

  const baseOutputCount = typhonTx.getOutputs().length;
  const prepared = typhonTx.prepareTransaction({
    inputs: sweepAll ? [] : inputs,
    changeAddress,
  });

  if (customFees) {
    applyCustomFee(prepared, baseOutputCount, new BigNumber(customFees.value.toString()));
  }

  return prepared;
}

/**
 * Craft an unsigned Cardano transaction from a CoinModule intent. Returns the unsigned CBOR
 * payload (ready for the downstream device-signing step) and the resolved fee.
 */
export async function craftTransaction(
  currency: CryptoCurrency,
  intent: TransactionIntent<StringMemo>,
  customFees?: FeeEstimation,
): Promise<CraftedTransaction> {
  const tx = await buildUnsignedTransaction(currency, intent, customFees);
  const { payload } = tx.buildTransaction();
  return {
    transaction: payload,
    details: { fees: tx.getFee().toFixed(0) },
  };
}

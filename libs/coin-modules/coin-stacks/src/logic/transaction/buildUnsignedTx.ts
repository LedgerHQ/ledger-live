import type {
  MemoNotSupported,
  StakingTransactionIntent,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import {
  AnchorMode,
  bufferCV,
  contractPrincipalCV,
  makeUnsignedContractCall,
  noneCV,
  Pc,
  someCV,
  StacksTransactionWire,
  uintCV,
} from "@stacks/transactions";
import type { StacksNetworkName } from "@stacks/network";
import BigNumber from "bignumber.js";
import {
  createStxTransferTransaction,
  createTokenTransferTransaction,
  validateAddress,
} from "../../common-logic";
import { STACKS_DUMMY_ADDRESS } from "../../constants";
import { fetchPoxInfo } from "../../network/pox";
import type { StacksTxData } from "../../types";
import { getBalance } from "../account/getBalance";
import { getStakes } from "../getStakes";

/** Same dummy-recipient substitution the legacy bridge's estimateMaxSpendable uses: the Send form
 * probes estimateFees before a valid recipient is entered, and a c32 address is embedded
 * structurally in the tx with no "encode empty" fallback. Never reaches a real send. */
function resolveRecipient(recipient: string): string {
  return validateAddress(recipient).isValid ? recipient : STACKS_DUMMY_ADDRESS;
}

/** Alpaca (CoinModuleApi) is currently wired mainnet-only for Stacks: the framework selects a
 * network by `currencyId`/coin config, not per transaction-intent, unlike the legacy bridge's
 * per-account `network` field. Testnet stays reachable through the legacy bridge only. */
export const NETWORK: StacksNetworkName = "mainnet";

function parseSip010AssetReference(assetReference: string): {
  contractAddress: string;
  contractName: string;
  assetName: string;
} {
  const [contractId, assetName] = assetReference.split("::");
  const [contractAddress, contractName] = contractId.split(".");
  if (!contractAddress || !contractName || !assetName) {
    throw new Error(`stacks: invalid SIP-010 asset reference "${assetReference}"`);
  }
  return { contractAddress, contractName, assetName };
}

/** Every pox-5 contract-call target (the pox contract itself, a delegate's signer-manager) is a
 * `ADDRESS.NAME` contract principal string from an external source (the node's `/v2/pox`, a
 * caller-supplied `valAddress`, a synthesized `Stake.delegate`) -- validate the shape here once
 * rather than letting a malformed value reach `contractPrincipalCV` with an `undefined` part and
 * fail with a less actionable error deeper in `@stacks/transactions`. */
function parseContractPrincipal(value: string, context: string): { address: string; name: string } {
  const [address, name] = value.split(".");
  if (!address || !name) {
    throw new Error(`stacks: invalid contract principal "${value}" (${context})`);
  }
  return { address, name };
}

/** `useAllAmount` isn't guaranteed to be pre-resolved by the caller (CoinModuleApi is
 * general-purpose, unlike the framework's own `prepareTransaction`), so it's resolved
 * defensively here too. Fee is native STX, so only subtracted for a native sweep. */
async function resolveAmount(
  intent: TransactionIntent<MemoNotSupported, StacksTxData>,
  fee: bigint,
): Promise<BigNumber> {
  if (!intent.useAllAmount) {
    return new BigNumber(intent.amount.toString());
  }

  const balances = await getBalance(intent.sender);
  const isToken = intent.asset.type !== "native";
  const assetReference = "assetReference" in intent.asset ? intent.asset.assetReference : undefined;
  const balance = balances.find(b =>
    isToken
      ? b.asset.type !== "native" &&
        "assetReference" in b.asset &&
        b.asset.assetReference === assetReference
      : b.asset.type === "native",
  );
  const spendable = (balance?.value ?? 0n) - (balance?.locked ?? 0n) - (isToken ? 0n : fee);
  return new BigNumber((spendable > 0n ? spendable : 0n).toString());
}

async function buildTransfer(
  intent: TransactionIntent<MemoNotSupported, StacksTxData>,
  fee: bigint,
  nonce: bigint,
): Promise<StacksTransactionWire> {
  if (!intent.senderPublicKey) {
    throw new Error("stacks: senderPublicKey is required to craft a transaction");
  }
  const feeAmount = new BigNumber(fee.toString());
  const nonceAmount = new BigNumber(nonce.toString());
  const amount = await resolveAmount(intent, fee);
  // Only guards the sweep case -- a not-yet-filled-in draft (amount 0) must still build, since
  // callers probe estimateFees before the user enters anything; validateIntent owns that check.
  if (intent.useAllAmount && amount.lte(0)) {
    throw new Error("stacks: transaction amount must be positive");
  }

  if (intent.asset.type === "native") {
    return createStxTransferTransaction(
      amount,
      resolveRecipient(intent.recipient),
      AnchorMode.Any,
      NETWORK,
      intent.senderPublicKey,
      {
        fee: feeAmount,
        nonce: nonceAmount,
      },
    );
  }

  const assetReference = "assetReference" in intent.asset ? intent.asset.assetReference : undefined;
  if (!assetReference) {
    throw new Error("stacks: token asset requires assetReference");
  }
  const { contractAddress, contractName, assetName } = parseSip010AssetReference(assetReference);

  return createTokenTransferTransaction({
    contractAddress,
    contractName,
    assetName,
    amount,
    senderAddress: intent.sender,
    recipientAddress: resolveRecipient(intent.recipient),
    anchorMode: AnchorMode.Any,
    network: NETWORK,
    publicKey: intent.senderPublicKey,
    fee: feeAmount,
    nonce: nonceAmount,
  });
}

async function buildStaking(
  intent: StakingTransactionIntent<MemoNotSupported, StacksTxData>,
  fee: bigint,
  nonce: bigint,
): Promise<StacksTransactionWire> {
  if (!intent.senderPublicKey) {
    throw new Error("stacks: senderPublicKey is required to craft a transaction");
  }

  const poxInfo = await fetchPoxInfo();
  const { address: poxAddress, name: poxName } = parseContractPrincipal(
    poxInfo.contract_id,
    "pox contract_id from /v2/pox",
  );

  if (intent.mode === "delegate") {
    const { numCycles, startBurnHt, signerCalldata } = intent.data;
    if (numCycles === undefined || startBurnHt === undefined) {
      throw new Error("stacks: staking requires data.numCycles and data.startBurnHt");
    }
    const { address: signerAddress, name: signerName } = parseContractPrincipal(
      intent.valAddress,
      "intent.valAddress",
    );

    return makeUnsignedContractCall({
      contractAddress: poxAddress,
      contractName: poxName,
      functionName: "stake",
      functionArgs: [
        contractPrincipalCV(signerAddress, signerName),
        uintCV(intent.amount),
        uintCV(numCycles),
        uintCV(startBurnHt),
        signerCalldata ? someCV(bufferCV(Buffer.from(signerCalldata, "hex"))) : noneCV(),
      ],
      network: NETWORK,
      publicKey: intent.senderPublicKey,
      fee: fee.toString(),
      nonce: nonce.toString(),
      // `stake` needs the amount bound `ustxToLock()` provides, unlike willPerformPox/
      // willNotPerformPox which are for calls that don't alter locking status.
      postConditions: [Pc.principal(intent.sender).willSendEq(intent.amount).ustxToLock()],
    });
  }

  if (intent.mode === "undelegate") {
    const { items } = await getStakes(intent.sender);
    const signerManager = items[0]?.delegate;
    if (!signerManager) {
      throw new Error("stacks: no active stake found to undelegate");
    }
    const { address: signerAddress, name: signerName } = parseContractPrincipal(
      signerManager,
      "Stake.delegate from getStakes",
    );

    return makeUnsignedContractCall({
      contractAddress: poxAddress,
      contractName: poxName,
      functionName: "unstake",
      functionArgs: [contractPrincipalCV(signerAddress, signerName)],
      network: NETWORK,
      publicKey: intent.senderPublicKey,
      fee: fee.toString(),
      nonce: nonce.toString(),
      postConditions: [Pc.principal(intent.sender).willNotPerformPox()],
    });
  }

  // redelegate/claimReward/compoundReward/withdraw: claiming is pool-contract-specific (no
  // uniform pox-5 interface), and redelegating is unstake-then-stake as two separate transactions.
  throw new Error(`staking mode "${intent.mode}" is not supported`);
}

export async function buildUnsignedTx(
  intent: TransactionIntent<MemoNotSupported, StacksTxData>,
  fee: bigint,
  nonce: bigint,
): Promise<StacksTransactionWire> {
  if (intent.intentType === "staking") {
    return buildStaking(
      intent as StakingTransactionIntent<MemoNotSupported, StacksTxData>,
      fee,
      nonce,
    );
  }
  return buildTransfer(intent, fee, nonce);
}

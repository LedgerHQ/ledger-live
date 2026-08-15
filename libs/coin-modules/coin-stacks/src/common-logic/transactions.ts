import {
  UnsignedTokenTransferOptions,
  makeUnsignedSTXTokenTransfer,
  makeUnsignedContractCall,
  uintCV,
  standardPrincipalCV,
  createMessageSignature,
  PostCondition,
  FungibleComparator,
  AssetString,
  UnsignedContractCallOptions,
  AnchorMode,
  StacksTransactionWire,
} from "@stacks/transactions";
import type { StacksNetworkName } from "@stacks/network";
import BigNumber from "bignumber.js";
import { memoToBufferCV } from "./memoUtils";

const specialConditionCode = new Set([
  "SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM.auto-alex-v3::auto-alex-v3",
  "SM26NBC8SFHNW4P1Y4DFH27974P56WN86C92HPEHH.token-lqstx::lqstx",
  "SP673Z4BPB4R73359K9HE55F2X91V5BJTN5SXZ5T.token-liabtc::liabtc",
]);

export type CreateTokenTransferTransactionOptions = {
  contractAddress: string;
  contractName: string;
  assetName: string;
  amount: BigNumber;
  senderAddress: string;
  recipientAddress: string;
  anchorMode: AnchorMode;
  network: string;
  publicKey: string;
  fee?: BigNumber;
  nonce?: BigNumber;
  memo?: string;
};

// Creates SIP-010 function arguments: [amount, sender, recipient, memo]
export const createTokenTransferFunctionArgs = (
  amount: BigNumber,
  senderAddress: string,
  recipientAddress: string,
  memo?: string,
) => {
  return [
    uintCV(amount.toFixed()), // Amount
    standardPrincipalCV(senderAddress), // Sender
    standardPrincipalCV(recipientAddress), // Recipient
    memoToBufferCV(memo), // Memo (optional)
  ];
};

// Creates post conditions for token transfer
// Uses "lte" for special tokens (auto-alex-v3, lqstx, liabtc), "eq" for others.
// @stacks/transactions@7 replaced the old {type: StacksMessageType.PostCondition,
// conditionType, principal, conditionCode, assetInfo} shape with a plain tagged union.
export const createTokenTransferPostConditions = (
  senderAddress: string,
  amount: BigNumber,
  contractAddress: string,
  contractName: string,
  assetName: string,
): PostCondition[] => {
  let condition: FungibleComparator = "eq";
  if (specialConditionCode.has(`${contractAddress}.${contractName}::${assetName}`)) {
    condition = "lte";
  }

  return [
    {
      type: "ft-postcondition",
      address: senderAddress,
      condition,
      asset: `${contractAddress}.${contractName}::${assetName}` as AssetString,
      amount: BigInt(amount.toFixed()),
    },
  ];
};

// Creates unsigned SIP-010 token transfer transaction
export const createTokenTransferTransaction = async (
  options: CreateTokenTransferTransactionOptions,
): Promise<StacksTransactionWire> => {
  const {
    contractAddress,
    contractName,
    assetName,
    amount,
    senderAddress,
    recipientAddress,
    network,
    publicKey,
    fee,
    nonce,
    memo,
  } = options;

  const functionArgs = createTokenTransferFunctionArgs(
    amount,
    senderAddress,
    recipientAddress,
    memo,
  );

  const postConditions = createTokenTransferPostConditions(
    senderAddress,
    amount,
    contractAddress,
    contractName,
    assetName,
  );

  // `network` takes a network name here, not a `@stacks/network` class instance (that package
  // stayed pinned at 6.x, whose StacksNetwork shape is unrelated to v7's).
  const contractCallOptions: UnsignedContractCallOptions = {
    contractAddress,
    contractName,
    functionName: "transfer",
    functionArgs,
    network: network as StacksNetworkName,
    publicKey,
    postConditions,
  };

  if (fee) {
    contractCallOptions.fee = fee.toFixed();
  }
  if (nonce) {
    contractCallOptions.nonce = nonce.toFixed();
  }

  return await makeUnsignedContractCall(contractCallOptions);
};

// Creates unsigned STX transfer transaction
export const createStxTransferTransaction = async (
  amount: BigNumber,
  recipientAddress: string,
  // Retained for call-site compatibility; unused by v7's UnsignedTokenTransferOptions.
  _anchorMode: AnchorMode,
  network: string,
  publicKey: string,
  { fee, nonce, memo }: { fee?: BigNumber; nonce?: BigNumber; memo?: string } = {},
): Promise<StacksTransactionWire> => {
  const options: UnsignedTokenTransferOptions = {
    amount: amount.toFixed(),
    recipient: recipientAddress,
    network: network as StacksNetworkName,
    memo,
    publicKey,
  };

  if (fee) {
    options.fee = fee.toFixed();
  }
  if (nonce) {
    options.nonce = nonce.toFixed();
  }

  return makeUnsignedSTXTokenTransfer(options);
};

// Applies signature to transaction and returns serialized buffer
export const applySignatureToTransaction = (
  tx: StacksTransactionWire,
  signature: string,
): Buffer => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - TS doesn't recognize spendingCondition.signature property
  tx.auth.spendingCondition.signature = createMessageSignature(signature);
  // v7's serialize() returns a hex string, not raw bytes -- decode it explicitly.
  return Buffer.from(tx.serialize(), "hex");
};

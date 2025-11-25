import {
  ConcordiumGRPCClient,
  AccountTransactionHeader,
  AccountTransactionSignature,
  BakerId,
  UpdateInstruction,
  CredentialRegistrationId,
  AccountAddress,
  streamToList,
  Energy,
  BlockHash,
  TransactionHash,
  AccountTransaction,
  AccountTransactionType,
  buildBasicAccountSigner,
  CcdAmount,
  ConcordiumGRPCWebClient,
  ConcordiumHdWallet,
  getAccountAddress,
  SimpleTransferPayload,
  TransactionExpiry,
  signTransaction,
} from "@concordium/web-sdk";
import { TokenId } from "@concordium/web-sdk/plt";
// ~/renderer/screens/dashboard/concordiumSimpleTransfer.ts

export type ConcordiumNetwork = "Mainnet" | "Testnet";

type SendSimpleTransferParams = {
  seedPhrase: string;
  network: ConcordiumNetwork;
  identityProviderIndex: number;
  identityIndex: number;
  credNumber: number;
  // nodeAddress: string; // e.g. "node.testnet.concordium.com"
  // nodePort: number; // e.g. 20000
  fromAddressBase58: string;
  toAddressBase58: string;
  amountMicroCcd: bigint; // 5_000_000n, etc.
  expiryMs?: number; // default: 6 min
};

import { ConcordiumGRPCNodeClient, credentials } from "@concordium/web-sdk/nodejs";
import type { Buffer } from "buffer/";
import { GrpcTransport } from "@protobuf-ts/grpc-transport";
import { GRPC, ConsensusAndGlobalResult } from "./preloadTypes";
import { stringify } from "./utils";

const defaultDeadlineMs = 15000;
let client: ConcordiumGRPCClient;

function createConcordiumClient(address: string, port: number, useSsl: boolean, timeout: number) {
  return new ConcordiumGRPCNodeClient(
    address,
    port,
    useSsl ? credentials.createSsl() : credentials.createInsecure(),
    { timeout },
  );
}
export function setClientLocation(address: string, port: string, useSsl: boolean) {
  client = createConcordiumClient(address, Number.parseInt(port, 10), useSsl, defaultDeadlineMs);
}

async function getConsensusStatusAndCryptographicParameters(
  address: string,
  port: string,
  useSsl: boolean,
): Promise<ConsensusAndGlobalResult> {
  try {
    const newClient = createConcordiumClient(
      address,
      Number.parseInt(port, 10),
      useSsl,
      defaultDeadlineMs,
    );
    const consensusStatus = await newClient.getConsensusStatus();
    const global = await newClient.getCryptographicParameters(consensusStatus.lastFinalizedBlock);
    if (!global) {
      return {
        successful: false,
        error: new Error("getCryptographicParameters returned undefined. "),
      };
    }
    return {
      successful: true,
      response: {
        consensusStatus,
        global,
      },
    };
  } catch (error) {
    return { successful: false, error: error as Error };
  }
}

export async function sendSimpleTransfer({
  seedPhrase,
  network,
  identityProviderIndex,
  identityIndex,
  credNumber,
  // nodeAddress,
  // nodePort,
  fromAddressBase58,
  toAddressBase58,
  amountMicroCcd,
  expiryMs = 6 * 60 * 1000, // 6 minutes
}: SendSimpleTransferParams): Promise<{ txHash: string; sender: string }> {
  // 1. Derive wallet & client
  const wallet = ConcordiumHdWallet.fromSeedPhrase(seedPhrase, network);
  console.log({ wallet, seedPhrase, network });

  // 2. Cryptographic params → credential id → sender address
  const cryptographicParameters = await client.getCryptographicParameters();
  const credId = wallet.getCredentialId(
    identityProviderIndex,
    identityIndex,
    credNumber,
    cryptographicParameters,
  );
  // ✅ Hex string
  const credIdHex = credId.toString("hex");

  // ✅ This now matches the expected type
  const sender2 = getAccountAddress(credIdHex);
  const sender3 = getAccountAddress(credId.toString("hex"));

  // console.log({ credIdHex, sender });
  // 3. Build payload
  const sender = AccountAddress.fromBase58(fromAddressBase58);
  console.log({ credIdHex, sender, sender2, sender3 });
  const toAddress = AccountAddress.fromBase58(toAddressBase58);
  const amount = CcdAmount.fromMicroCcd(amountMicroCcd.toString());

  const payload: SimpleTransferPayload = {
    amount,
    toAddress,
  };

  // 4. Expiry + nonce
  const expiry = TransactionExpiry.fromDate(new Date(Date.now() + expiryMs));
  const { nonce } = await client.getNextAccountNonce(sender);
  console.log({ nonce });

  const header: AccountTransactionHeader = {
    expiry,
    nonce,
    sender,
  };

  const transaction: AccountTransaction = {
    type: AccountTransactionType.Transfer,
    payload,
    header,
  };

  // 5. Sign
  const signingKey = wallet.getAccountSigningKey(identityProviderIndex, identityIndex, credNumber);

  const signer = buildBasicAccountSigner(signingKey.toString("hex"));
  console.log({ signingKey, signer });
  const signature = await signTransaction(transaction, signer);

  // 6. Send
  const txHash = await client.sendAccountTransaction(transaction, signature);

  // NOTE: maybe use txHash.toHexString()
  return { txHash: txHash.toString(), sender: sender.address };
}

const exposedMethods: GRPC = {
  // Updates the location of the grpc endpoint.
  setLocation: (address: string, port: string, useSsl: boolean) => {
    return setClientLocation(address, port, useSsl);
  },
  sendAccountTransaction: (
    header: AccountTransactionHeader,
    energyCost: bigint,
    payload: Buffer,
    signature: AccountTransactionSignature,
  ) =>
    client
      .sendRawAccountTransaction(header, Energy.create(energyCost), payload, signature)
      .then(stringify),
  sendUpdateInstruction: (
    updateInstructionTransaction: UpdateInstruction,
    signatures: Record<number, string>,
  ) => client.sendUpdateInstruction(updateInstructionTransaction, signatures).then(stringify),
  getCryptographicParameters: (blockHash: string) =>
    client.getCryptographicParameters(BlockHash.fromHexString(blockHash)).then(stringify),
  getConsensusStatus: () => client.getConsensusStatus().then(stringify),
  getTransactionStatus: (transactionHash: string) =>
    client.getBlockItemStatus(TransactionHash.fromHexString(transactionHash)).then(stringify),
  waitForTransactionFinalization: (transactionHash: string, timeoutms?: number) =>
    client
      .waitForTransactionFinalization(TransactionHash.fromHexString(transactionHash), timeoutms)
      .then(stringify),
  getNextAccountNonce: (address: string) =>
    client.getNextAccountNonce(AccountAddress.fromBase58(address)).then(stringify),
  getBlockChainParameters: (blockHash?: string) =>
    client
      .getBlockChainParameters(blockHash ? BlockHash.fromHexString(blockHash) : undefined)
      .then(stringify),
  getNextUpdateSequenceNumbers: (blockHash?: string) =>
    client
      .getNextUpdateSequenceNumbers(blockHash ? BlockHash.fromHexString(blockHash) : undefined)
      .then(stringify),
  getAccountInfo: (address: string, blockHash?: string) =>
    client
      .getAccountInfo(
        AccountAddress.fromBase58(address),
        blockHash ? BlockHash.fromHexString(blockHash) : undefined,
      )
      .then(stringify),
  getTokenInfo: (tokenId: TokenId.Type) => client.getTokenInfo(tokenId).then(stringify),
  getAccountInfoOfCredential: (credId: string, blockHash?: string) =>
    client
      .getAccountInfo(
        CredentialRegistrationId.fromHexString(credId),
        blockHash ? BlockHash.fromHexString(blockHash) : undefined,
      )
      .then(stringify),
  getIdentityProviders: (blockHash: string) =>
    streamToList(client.getIdentityProviders(BlockHash.fromHexString(blockHash))).then(stringify),
  getAnonymityRevokers: (blockHash: string) =>
    streamToList(client.getAnonymityRevokers(BlockHash.fromHexString(blockHash))).then(stringify),
  healthCheck: async () => client.healthCheck().then(stringify),
  // Creates a standalone GRPC client for testing the connection
  // to a node. This is used to verify that when changing connection
  // that the new node is on the same blockchain as the wallet was previously connected to.
  nodeConsensusAndGlobal: async (address: string, port: string, useSsl: boolean) =>
    getConsensusStatusAndCryptographicParameters(address, port, useSsl).then(stringify),
  getRewardStatus: (blockHash?: string) =>
    client
      .getTokenomicsInfo(blockHash ? BlockHash.fromHexString(blockHash) : undefined)
      .then(stringify),
  getPoolInfo: (bakerId: BakerId, blockHash?: string) =>
    client
      .getPoolInfo(bakerId, blockHash ? BlockHash.fromHexString(blockHash) : undefined)
      .then(stringify),
  getPassiveDelegationInfo: (blockHash?: string) =>
    client
      .getPassiveDelegationInfo(blockHash ? BlockHash.fromHexString(blockHash) : undefined)
      .then(stringify),
  sendSimpleTransfer: (params: any) => sendSimpleTransfer(params).then(stringify),
};

export default exposedMethods;

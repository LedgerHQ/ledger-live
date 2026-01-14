import type {
  Block,
  BlockInfo,
  BlockOperation,
  BlockTransaction,
  Operation,
  Pagination,
} from "@ledgerhq/coin-framework/api/index";
import {
  ConcordiumGRPCWebClient,
  CredentialRegistrationId,
  streamToList,
  TransactionExpiry,
  TransactionHash,
} from "@ledgerhq/concordium-sdk-adapter";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import coinConfig from "../config";

const DEFAULT_RETRIES = 1;
const RETRY_DELAY = 1000;
const MAX_BLOCKS_TO_SCAN = 1000;

const CLIENTS_BY_CURRENCY = new Map<CryptoCurrency["id"], ConcordiumGRPCWebClient>();

export function getGrpcClient(currency: CryptoCurrency): ConcordiumGRPCWebClient {
  const existing = CLIENTS_BY_CURRENCY.get(currency.id);
  if (existing) {
    return existing;
  }

  const config = coinConfig.getCoinConfig(currency);
  const address = config.grpcUrl;
  const port = config.grpcPort;

  const client = new ConcordiumGRPCWebClient(address, port);

  CLIENTS_BY_CURRENCY.set(currency.id, client);
  return client;
}

export async function withClient<T>(
  currency: CryptoCurrency,
  execute: (client: ConcordiumGRPCWebClient) => Promise<T>,
  retries = DEFAULT_RETRIES,
): Promise<T> {
  const client = getGrpcClient(currency);

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await execute(client);
    } catch (e) {
      lastError = e;
      if (attempt < retries) {
        await delay(RETRY_DELAY);
      }
    }
  }

  throw lastError;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getLastBlock(currency: CryptoCurrency): Promise<{
  blockHeight: number;
  blockHash: string;
  timestamp: number;
}> {
  return withClient(currency, async client => {
    const consensusStatus = await client.getConsensusStatus();
    return {
      blockHeight: Number(consensusStatus.lastFinalizedBlockHeight),
      blockHash: consensusStatus.lastFinalizedBlock.toString(),
      timestamp: Number(consensusStatus.lastFinalizedTime),
    };
  });
}

export async function getAccountInfo(
  currency: CryptoCurrency,
  credId: string,
): Promise<Awaited<ReturnType<ConcordiumGRPCWebClient["getAccountInfo"]>>> {
  const credentialRegistrationId = CredentialRegistrationId.fromHexString(credId);
  return withClient(currency, async client => {
    return await client.getAccountInfo(credentialRegistrationId);
  });
}

export async function getBlockChainParameters(
  currency: CryptoCurrency,
): Promise<Awaited<ReturnType<ConcordiumGRPCWebClient["getBlockChainParameters"]>>> {
  return withClient(currency, async client => {
    return await client.getBlockChainParameters();
  });
}

export async function sendCredentialDeploymentTransaction(
  currency: CryptoCurrency,
  payload: Uint8Array,
  expiry: TransactionExpiry.Type,
): Promise<TransactionHash.Type> {
  return withClient(currency, async client => {
    return client.sendCredentialDeploymentTransaction(payload, expiry);
  });
}

export async function getBlockInfoByHeight(
  height: number,
  currency: CryptoCurrency,
): Promise<BlockInfo> {
  return withClient(currency, async client => {
    const blockHashes = await client.getBlocksAtHeight(BigInt(height));

    if (blockHashes.length === 0) {
      throw new Error(`No blocks found at height ${height}`);
    }

    const blockHash = blockHashes[0];
    const blockInfo = await client.getBlockInfo(blockHash);

    const result: BlockInfo = {
      height: Number(blockInfo.blockHeight),
      hash: blockInfo.blockHash.toString(),
      time: blockInfo.blockSlotTime,
    };

    if (height > 0) {
      const parentHashes = await client.getBlocksAtHeight(BigInt(height - 1));
      if (parentHashes.length > 0) {
        const parentBlockInfo = await client.getBlockInfo(parentHashes[0]);
        result.parent = {
          height: Number(parentBlockInfo.blockHeight),
          hash: parentBlockInfo.blockHash.toString(),
          time: parentBlockInfo.blockSlotTime,
        };
      }
    }

    return result;
  });
}

export async function getBlockByHeight(height: number, currency: CryptoCurrency): Promise<Block> {
  return withClient(currency, async client => {
    const blockHashes = await client.getBlocksAtHeight(BigInt(height));

    if (blockHashes.length === 0) {
      throw new Error(`No blocks found at height ${height}`);
    }

    const blockHash = blockHashes[0];
    const blockInfo = await client.getBlockInfo(blockHash);

    const info: BlockInfo = {
      height: Number(blockInfo.blockHeight),
      hash: blockInfo.blockHash.toString(),
      time: blockInfo.blockSlotTime,
    };

    if (height > 0) {
      const parentHashes = await client.getBlocksAtHeight(BigInt(height - 1));
      if (parentHashes.length > 0) {
        const parentBlockInfo = await client.getBlockInfo(parentHashes[0]);
        info.parent = {
          height: Number(parentBlockInfo.blockHeight),
          hash: parentBlockInfo.blockHash.toString(),
          time: parentBlockInfo.blockSlotTime,
        };
      }
    }

    const transactionEvents = await streamToList(client.getBlockTransactionEvents(blockHash));
    const transactions: BlockTransaction[] = transactionEvents
      .map(event => {
        if (event === null || event.type !== "accountTransaction") {
          return null;
        }

        const accountTx = event;
        const failed = accountTx.transactionType === "failed";
        const hash = accountTx.hash.toString();
        const fees = BigInt(accountTx.cost.toString());
        const sender = accountTx.sender.toString();

        const operations: BlockOperation[] = [];

        if (
          accountTx.transactionType === "transfer" ||
          accountTx.transactionType === "transferWithMemo"
        ) {
          const transfer = accountTx.transfer;
          const amount = BigInt(transfer.amount.microCcdAmount.toString());
          const from = sender;
          const to = transfer.to.toString();

          operations.push(
            {
              type: "transfer",
              address: from,
              peer: to,
              asset: { type: "native" },
              amount: -amount,
            },
            {
              type: "transfer",
              address: to,
              peer: from,
              asset: { type: "native" },
              amount: amount,
            },
          );
        }

        return {
          hash,
          failed,
          operations,
          fees,
          feesPayer: sender,
        };
      })
      .filter((tx): tx is BlockTransaction => tx !== null);

    return {
      info,
      transactions,
    };
  });
}

export async function getOperations(
  address: string,
  page: Pagination,
  currency: CryptoCurrency,
): Promise<[Operation[], string]> {
  const { blockHeight: currentHeight } = await getLastBlock(currency);

  if (page.minHeight > currentHeight) {
    return [[], ""];
  }

  const startHeight = BigInt(page.minHeight);
  const endHeight = BigInt(Math.min(currentHeight, page.minHeight + MAX_BLOCKS_TO_SCAN));

  return withClient(currency, async client => {
    const operations: Operation[] = [];

    for (let height = startHeight; height <= endHeight; height++) {
      const blockHashes = await client.getBlocksAtHeight(height);
      if (blockHashes.length === 0) continue;

      const blockHash = blockHashes[0];
      const blockInfo = await client.getBlockInfo(blockHash);
      const transactionEvents = await streamToList(client.getBlockTransactionEvents(blockHash));

      for (const event of transactionEvents) {
        if (event === null || event.type !== "accountTransaction") {
          continue;
        }

        const accountTx = event;
        const sender = accountTx.sender.toString();
        const isOutgoing = sender === address;

        if (
          !isOutgoing &&
          accountTx.transactionType !== "transfer" &&
          accountTx.transactionType !== "transferWithMemo"
        ) {
          continue;
        }

        let isIncoming = false;
        if (
          (accountTx.transactionType === "transfer" ||
            accountTx.transactionType === "transferWithMemo") &&
          accountTx.transfer
        ) {
          const recipient = accountTx.transfer.to.toString();
          isIncoming = recipient === address;
        }

        if (!isOutgoing && !isIncoming) {
          continue;
        }

        const hash = accountTx.hash.toString();
        const failed = accountTx.transactionType === "failed";
        const fees = BigInt(accountTx.cost.toString());
        const blockHeight = Number(blockInfo.blockHeight);
        const blockTime = blockInfo.blockSlotTime;

        let value = BigInt(0);
        const senders: string[] = [];
        const recipients: string[] = [];

        if (
          accountTx.transactionType === "transfer" ||
          accountTx.transactionType === "transferWithMemo"
        ) {
          const transfer = accountTx.transfer;
          value = BigInt(transfer.amount.microCcdAmount.toString());
          senders.push(sender);
          recipients.push(transfer.to.toString());
        }

        if (isOutgoing) {
          value += fees;
        }

        operations.push({
          id: hash,
          asset: { type: "native" as const },
          tx: {
            hash,
            fees,
            date: blockTime,
            failed,
            block: {
              height: blockHeight,
              hash: blockHash.toString(),
              time: blockTime,
            },
          },
          type: isOutgoing ? "OUT" : "IN",
          value,
          senders,
          recipients,
        });
      }
    }

    operations.sort((a, b) => b.tx.date.getTime() - a.tx.date.getTime());

    return [operations, ""];
  });
}

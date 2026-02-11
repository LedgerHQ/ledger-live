/**
 * Concordium gRPC Client
 *
 * Wraps the Concordium blockchain gRPC API for querying consensus state,
 * blocks, and transaction history. Handles client caching, retries, and
 * type conversions between gRPC responses and Ledger Live types.
 */
import { join } from "node:path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { retry } from "@ledgerhq/live-promise";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type {
  Block,
  BlockInfo,
  BlockOperation,
  BlockTransaction,
  Operation,
  Pagination,
} from "@ledgerhq/coin-framework/api/index";
import { log } from "@ledgerhq/logs";
import coinConfig from "../config";

interface ProtoGRPCType {
  concordium: {
    v2: {
      Queries: new (endpoint: string, credentials: grpc.ChannelCredentials) => GRPCClient;
    };
  };
}

function isValidProtoDescriptor(obj: unknown): obj is ProtoGRPCType {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "concordium" in obj &&
    typeof (obj as Record<string, unknown>).concordium === "object" &&
    (obj as Record<string, unknown>).concordium !== null &&
    "v2" in ((obj as Record<string, unknown>).concordium as Record<string, unknown>) &&
    "Queries" in
      (((obj as Record<string, unknown>).concordium as Record<string, unknown>).v2 as Record<
        string,
        unknown
      >)
  );
}

function loadProtoDescriptor(packageDefinition: protoLoader.PackageDefinition): ProtoGRPCType {
  const grpcObject = grpc.loadPackageDefinition(packageDefinition);
  if (!isValidProtoDescriptor(grpcObject)) {
    throw new Error("Invalid proto descriptor structure - missing concordium.v2.Queries");
  }
  return grpcObject;
}

interface GetConsensusInfoResponse {
  lastFinalizedBlockHeight: { value: string };
  lastFinalizedBlock: { value: Buffer };
  lastFinalizedTime?: { value: string };
}

interface GetBlocksAtHeightResponse {
  blocks: Array<{ value: string }>;
}

interface GetBlockInfoResponse {
  height: { value: string };
  hash: { value: Buffer };
  slotTime?: { value: string };
}

interface GetBlockTransactionEventsStreamItem {
  type?: string;
  accountTransaction?: {
    hash: string;
    sender: string;
    cost: string;
    transactionType?: string;
    type?: string;
    effects?: {
      accountTransfer?: {
        amount: string;
        to: string;
      };
      transferWithMemo?: {
        amount: string;
        to: string;
      };
    };
  };
}

interface BlockTransactionEvent {
  type: string;
  hash?: string;
  sender?: string;
  cost?: bigint;
  transactionType?: string;
  transfer?: {
    amount: bigint;
    to: string;
  };
}

type GrpcCallback<TResponse> = (error: Error | null, response: TResponse) => void;

interface GRPCClient {
  GetConsensusInfo: (
    request: Record<string, never>,
    callback: GrpcCallback<GetConsensusInfoResponse>,
  ) => void;
  GetBlocksAtHeight: (
    request: { absolute: { height: { value: string } } },
    callback: GrpcCallback<GetBlocksAtHeightResponse>,
  ) => void;
  GetBlockInfo: (
    request: { given?: { value: Buffer }; lastFinal?: {}; best?: {} },
    callback: GrpcCallback<GetBlockInfoResponse>,
  ) => void;
  GetBlockTransactionEvents: (request: {
    given?: { value: Buffer };
    lastFinal?: {};
    best?: {};
  }) => AsyncIterable<GetBlockTransactionEventsStreamItem>;
}

const DEFAULT_RETRIES = 1;
const RETRY_DELAY = 1000;
const MAX_BLOCKS_TO_SCAN = 1000;

function createGrpcClient(currency: CryptoCurrency): GRPCClient {
  const { grpcUrl: address, grpcPort: port } = coinConfig.getCoinConfig(currency);

  try {
    const protoPath = join(__dirname, "proto/v2/concordium/service.proto");
    const protoDir = join(__dirname, "proto");

    const packageDefinition = protoLoader.loadSync(protoPath, {
      keepCase: false,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
      includeDirs: [protoDir],
    });

    const protoDescriptor = loadProtoDescriptor(packageDefinition);

    const hostname = address.replace(/^https?:\/\//, "");
    const endpoint = `${hostname}:${port}`;
    return new protoDescriptor.concordium.v2.Queries(endpoint, grpc.credentials.createSsl());
  } catch (error) {
    log("concordium-grpc", "Failed to initialize Concordium gRPC client", { error });

    throw error;
  }
}

const CLIENTS_BY_CURRENCY = new Map<CryptoCurrency["id"], GRPCClient>();

export function getClient(currency: CryptoCurrency): GRPCClient {
  const existing = CLIENTS_BY_CURRENCY.get(currency.id);
  if (existing) return existing;

  const client = createGrpcClient(currency);
  CLIENTS_BY_CURRENCY.set(currency.id, client);
  return client;
}

export async function withClient<T>(
  currency: CryptoCurrency,
  execute: (client: GRPCClient) => Promise<T>,
  retries = DEFAULT_RETRIES,
): Promise<T> {
  const client = getClient(currency);

  return retry(() => execute(client), {
    maxRetry: retries,
    interval: RETRY_DELAY,
    intervalMultiplicator: 1,
  });
}

/**
 * Convert async iterable stream to array.
 *
 * Used to consume gRPC streaming responses (GetBlockTransactionEvents).
 * Collects all items from the stream into a single array.
 */
async function streamToList<T>(stream: AsyncIterable<T>): Promise<T[]> {
  const result: T[] = [];
  for await (const item of stream) {
    result.push(item);
  }
  return result;
}

/**
 * Get the last finalized block information.
 *
 * Used by: history/lastBlock.ts
 *
 * @param currency - The cryptocurrency configuration
 * @returns Block metadata (height, hash, time) of the last finalized block
 */
export async function getLastBlock(currency: CryptoCurrency): Promise<BlockInfo> {
  try {
    return await withClient(currency, async client => {
      return new Promise<BlockInfo>((resolve, reject) => {
        client.GetConsensusInfo({}, (error, response) => {
          if (error) {
            reject(error);
            return;
          }

          const { lastFinalizedBlockHeight, lastFinalizedBlock, lastFinalizedTime } = response;

          resolve({
            height: Number(lastFinalizedBlockHeight?.value || 0),
            hash: lastFinalizedBlock?.value?.toString("hex") || "",
            time: new Date(lastFinalizedTime?.value ? Number(lastFinalizedTime.value) : Date.now()),
          });
        });
      });
    });
  } catch (error) {
    log("concordium-grpc", "getLastBlock", { error });
    throw error;
  }
}

function handleBlocksResponse(
  error: Error | null,
  response: GetBlocksAtHeightResponse,
  resolve: (value: string[]) => void,
  reject: (reason: Error) => void,
): void {
  if (error) {
    reject(error);
    return;
  }

  const blocks: string[] = (response.blocks || []).map(block => block.value);
  resolve(blocks);
}

/**
 * Get block hash(es) at a specific height.
 *
 * Wraps: GetBlocksAtHeight gRPC method
 *
 * Note: Concordium can have multiple blocks at the same height (forks),
 * but we typically use the first one as the canonical block.
 */
async function getBlockHashesAtHeight(currency: CryptoCurrency, height: number): Promise<string[]> {
  const fetchBlocks = (client: GRPCClient): Promise<string[]> => {
    return new Promise<string[]>((resolve, reject) => {
      client.GetBlocksAtHeight(
        { absolute: { height: { value: String(height) } } },
        (error, response) => handleBlocksResponse(error, response, resolve, reject),
      );
    });
  };

  try {
    return await withClient(currency, fetchBlocks);
  } catch (error) {
    log("concordium-grpc", "getBlockHashesAtHeight", { error });
    throw error;
  }
}

/**
 * Get block metadata by hash.
 *
 * Wraps: GetBlockInfo gRPC method
 *
 * Converts gRPC response types to Ledger Live BlockInfo format.
 */
async function getBlockInfo(currency: CryptoCurrency, blockHash: string): Promise<BlockInfo> {
  try {
    return await withClient(currency, async client => {
      return new Promise<BlockInfo>((resolve, reject) => {
        client.GetBlockInfo(
          { given: { value: Buffer.from(blockHash, "hex") } },
          (error, response) => {
            if (error) {
              reject(error);
              return;
            }

            const height: number = Number(response.height?.value || 0);
            const hash: string = response.hash?.value?.toString("hex") || "";
            const time: Date = response.slotTime?.value
              ? new Date(Number(response.slotTime.value))
              : new Date();

            resolve({ height, hash, time });
          },
        );
      });
    });
  } catch (error) {
    log("concordium-grpc", "getBlockInfo", { error });
    throw error;
  }
}

/**
 * Get block metadata by height, including parent block reference.
 *
 * Used by: history/getBlockInfo.ts
 *
 * Composes: getBlockHashesAtHeight + getBlockInfo (for block and parent)
 *
 * @param currency - The cryptocurrency configuration
 * @param height - Block height to query
 * @returns Block metadata with parent block reference (if height > 0)
 */
export async function getBlockInfoByHeight(
  currency: CryptoCurrency,
  height: number,
): Promise<BlockInfo> {
  try {
    const blockHashes = await getBlockHashesAtHeight(currency, height);

    if (blockHashes.length === 0) {
      throw new Error(`No blocks found at height ${height}`);
    }

    const blockHash = blockHashes[0];
    const result = await getBlockInfo(currency, blockHash);

    if (height > 0) {
      const parentHashes = await getBlockHashesAtHeight(currency, height - 1);

      if (parentHashes.length > 0) {
        const parentBlockInfo = await getBlockInfo(currency, parentHashes[0]);
        result.parent = {
          height: parentBlockInfo.height,
          hash: parentBlockInfo.hash!,
        };
      }
    }

    return result;
  } catch (error) {
    log("concordium-grpc", "getBlockInfoByHeight", { error });
    throw error;
  }
}

/**
 * Internal helper: Stream transaction events from a block.
 *
 * Wraps: GetBlockTransactionEvents gRPC method
 *
 * Parses the raw gRPC stream into typed transaction events with transfers,
 * filtering out non-account transactions and processing transfer effects.
 */
async function getBlockTransactionEvents(
  currency: CryptoCurrency,
  blockHash: string,
): Promise<AsyncIterable<BlockTransactionEvent>> {
  try {
    return await withClient(currency, async client => {
      const request = {
        given: { value: Buffer.from(blockHash, "hex") },
      };

      const stream: AsyncIterable<GetBlockTransactionEventsStreamItem> =
        client.GetBlockTransactionEvents(request);

      function processAccountTransaction(
        processedEvent: BlockTransactionEvent,
        tx: NonNullable<GetBlockTransactionEventsStreamItem["accountTransaction"]>,
      ): void {
        processedEvent.type = "accountTransaction";

        if (tx.hash) {
          processedEvent.hash = tx.hash;
        }

        if (tx.sender) {
          processedEvent.sender = tx.sender;
        }

        if (tx.cost) {
          processedEvent.cost = BigInt(tx.cost);
        }

        const txType = tx.transactionType || tx.type;
        if (txType) {
          processedEvent.transactionType = txType;
        }

        if (tx.effects?.accountTransfer) {
          const transfer = tx.effects.accountTransfer;
          processedEvent.transactionType = "transfer";
          processedEvent.transfer = {
            amount: BigInt(transfer.amount || 0),
            to: transfer.to,
          };
        } else if (tx.effects?.transferWithMemo) {
          const transfer = tx.effects.transferWithMemo;
          processedEvent.transactionType = "transferWithMemo";
          processedEvent.transfer = {
            amount: BigInt(transfer.amount || 0),
            to: transfer.to,
          };
        }
      }

      async function* processStream(): AsyncIterable<BlockTransactionEvent> {
        for await (const event of stream) {
          if (!event) continue;

          const processedEvent: BlockTransactionEvent = {
            type: event.type || "unknown",
          };

          if (event.accountTransaction) {
            processAccountTransaction(processedEvent, event.accountTransaction);
          }

          yield processedEvent;
        }
      }

      return processStream();
    });
  } catch (error) {
    log("concordium-grpc", "getBlockTransactionEvents", { error });
    throw error;
  }
}

/**
 * Get a complete block with all parsed transactions.
 *
 * Used by: history/getBlock.ts
 *
 * Composes: getBlockHashesAtHeight + getBlockInfo + getBlockTransactionEvents
 *
 * Parses transaction events into Ledger Live Block format with operations
 * (transfers IN/OUT). Filters to account transactions only.
 *
 * @param currency - The cryptocurrency configuration
 * @param height - Block height to query
 * @returns Full block with metadata and parsed transactions
 */
export async function getBlockByHeight(currency: CryptoCurrency, height: number): Promise<Block> {
  try {
    const blockHashes = await getBlockHashesAtHeight(currency, height);

    if (blockHashes.length === 0) {
      throw new Error(`No blocks found at height ${height}`);
    }

    const blockHash = blockHashes[0];
    const info = await getBlockInfo(currency, blockHash);

    if (height > 0) {
      const parentHashes = await getBlockHashesAtHeight(currency, height - 1);

      if (parentHashes.length > 0) {
        const parentBlockInfo = await getBlockInfo(currency, parentHashes[0]);
        info.parent = {
          height: parentBlockInfo.height,
          hash: parentBlockInfo.hash!,
        };
      }
    }

    const transactionStream = await getBlockTransactionEvents(currency, blockHash);
    const transactionEvents = await streamToList(transactionStream);

    const transactions: BlockTransaction[] = transactionEvents
      .map(event => {
        if (event?.type !== "accountTransaction") {
          return null;
        }

        const accountTx = event;
        const failed = accountTx.transactionType === "failed";
        const hash = accountTx.hash ?? "";
        const fees = accountTx.cost ?? 0n;
        const sender = accountTx.sender ?? "";

        const operations: BlockOperation[] = [];

        if (
          accountTx.transactionType === "transfer" ||
          accountTx.transactionType === "transferWithMemo"
        ) {
          const transfer = accountTx.transfer!;
          const amount = transfer.amount;
          const from = sender;
          const to = transfer.to;

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
  } catch (error) {
    log("concordium-grpc", "getBlockByHeight", { error });
    throw error;
  }
}

function processTransactionForAddress(
  event: BlockTransactionEvent,
  address: string,
  blockInfo: BlockInfo,
  blockHash: string,
): Operation | null {
  if (event?.type !== "accountTransaction") {
    return null;
  }

  const accountTx = event;
  const sender = accountTx.sender ?? "";
  const isOutgoing = sender === address;

  if (
    !isOutgoing &&
    accountTx.transactionType !== "transfer" &&
    accountTx.transactionType !== "transferWithMemo"
  ) {
    return null;
  }

  let isIncoming = false;
  if (
    (accountTx.transactionType === "transfer" ||
      accountTx.transactionType === "transferWithMemo") &&
    accountTx.transfer
  ) {
    const recipient = accountTx.transfer.to;
    isIncoming = recipient === address;
  }

  if (!isOutgoing && !isIncoming) {
    return null;
  }

  const hash = accountTx.hash ?? "";
  const failed = accountTx.transactionType === "failed";
  const fees = accountTx.cost ?? 0n;
  const blockHeight = blockInfo.height;
  const blockTime = blockInfo.time!;

  let value = BigInt(0);
  const senders: string[] = [];
  const recipients: string[] = [];

  if (
    accountTx.transactionType === "transfer" ||
    accountTx.transactionType === "transferWithMemo"
  ) {
    const transfer = accountTx.transfer!;
    value = transfer.amount;
    senders.push(sender);
    recipients.push(transfer.to);
  }

  if (isOutgoing) {
    value += fees;
  }

  return {
    id: hash,
    asset: { type: "native" as const },
    tx: {
      hash,
      fees,
      date: blockTime,
      failed,
      block: {
        height: blockHeight,
        hash: blockHash,
        time: blockTime,
      },
    },
    type: isOutgoing ? "OUT" : "IN",
    value,
    senders,
    recipients,
  };
}

/**
 * Scan blocks for operations related to a specific address.
 *
 * Used by: history/listOperations.ts
 *
 * Composes: getLastBlock + getBlockHashesAtHeight + getBlockInfo + getBlockTransactionEvents
 *
 * Scans up to MAX_BLOCKS_TO_SCAN blocks starting from page.minHeight,
 * filtering for transactions where the address is sender or recipient.
 * Returns operations sorted by date (newest first).
 *
 * @param currency - The cryptocurrency configuration
 * @param address - The account address to filter operations for
 * @param page - Pagination parameters (minHeight determines scan start)
 * @returns Array of operations and cursor (stringified next block height if more results, empty string otherwise)
 */
export async function getOperations(
  currency: CryptoCurrency,
  address: string,
  page: Pagination,
): Promise<[Operation[], string]> {
  try {
    const { height: currentHeight } = await getLastBlock(currency);

    if (page.minHeight > currentHeight) {
      return [[], ""];
    }

    const startHeight = page.minHeight;
    const endHeight = Math.min(currentHeight, page.minHeight + MAX_BLOCKS_TO_SCAN);

    const operations: Operation[] = [];

    for (let height = startHeight; height <= endHeight; height++) {
      const blockHashes = await getBlockHashesAtHeight(currency, height);

      if (blockHashes.length === 0) continue;

      const blockHash = blockHashes[0];
      const blockInfo = await getBlockInfo(currency, blockHash);

      const transactionStream = await getBlockTransactionEvents(currency, blockHash);
      const transactionEvents = await streamToList(transactionStream);

      for (const event of transactionEvents) {
        const operation = processTransactionForAddress(event, address, blockInfo, blockHash);
        if (operation) {
          operations.push(operation);
        }
      }
    }

    operations.sort((a, b) => b.tx.date.getTime() - a.tx.date.getTime());

    const hasMore = endHeight < currentHeight;
    const nextCursor = hasMore ? JSON.stringify(endHeight + 1) : "";

    return [operations, nextCursor];
  } catch (error) {
    log("concordium-grpc", "getOperations", { error });
    throw error;
  }
}

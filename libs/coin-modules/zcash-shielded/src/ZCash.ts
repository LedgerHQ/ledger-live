import { Observable, timer, concat, from, EMPTY } from "rxjs";
import { map, scan, take, tap, mergeMap } from "rxjs/operators";
import type { Account } from "@ledgerhq/types-live";
import type { AccountShapeInfo } from "@ledgerhq/coin-framework/bridge/jsHelpers";

// Shielded sync state constants
export const SHIELDED_SYNC_DISABLED = 0x00;
export const SHIELDED_SYNC_REQUIRED = 0x01;
export const SHIELDED_SYNC_IN_PROGRESS = SHIELDED_SYNC_REQUIRED << 1;
export const SHIELDED_SYNC_PAUSE = SHIELDED_SYNC_REQUIRED << 2;
export const SHIELDED_SYNC_COMPLETED = SHIELDED_SYNC_REQUIRED << 3;

function getShieldedSyncState(account: Account | undefined): number {
  if (account === undefined || !("isZcashShieldedSyncState" in account)) {
    return 0;
  }
  // Property exists, access it safely
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const accountWithState = account as any;
  return typeof accountWithState.isZcashShieldedSyncState === "number"
    ? accountWithState.isZcashShieldedSyncState
    : 0;
}
export type ShieldedTransaction = {
  hash: string;
  blockHeight: number;
  blockHash: string;
  timestamp: Date;
  value: string; // BigNumber as string to avoid dependency
  fee: string; // BigNumber as string
  type: "IN" | "OUT";
  senders: string[];
  recipients: string[];
  encryptedData?: string; // Encrypted transaction data before decryption
  decryptedData?: string; // Decrypted transaction data
};

/**
 * Result of shielded synchronization containing raw operations.
 */
export type ShieldedSyncResult = {
  operations: ShieldedTransaction[];
  latestBlockHeight: number;
};

export default class ZCash {
  static readonly AVERAGE_BLOCK_SYNC_TIME_MS = 5;

  /**
   * Estimates sync time given a start and an end block.
   *
   * @param startBlock starting block
   * @param endBlock end block, usually the latest confirmed block
   * @return the estimated sync time
   */
  async estimateSyncTime(startBlock: number, endBlock: number) {
    return (endBlock - startBlock) * ZCash.AVERAGE_BLOCK_SYNC_TIME_MS;
  }

  /**
   * Decrypts a ZCash shielded - i.e., encrypted - transaction.
   *
   * @param encryptedTransaction string raw string representing an encrypted transaction.
   * @return a decrypted transaction
   */
  async decryptTransaction(encryptedTransaction: string): Promise<string> {
    return `decrypted_${encryptedTransaction}`;
  }

  /**
   * Finds the lowest block height correspondent to a given timestamp
   *
   * @param timestamp
   * @return a block height
   */
  async findBlockHeight(timestamp: number): Promise<number> {
    return timestamp + 42;
  }
}

/**
 * Fetches a block from the blockchain (mocked for now); In the real implementation, this would call the Zcash blockchain API.
 */
async function fetchBlockMock(blockHeight: number): Promise<{
  height: number;
  hash: string;
  timestamp: Date;
  transactions: string[];
}> {
  return {
    height: blockHeight,
    hash: `block_${blockHeight}`,
    timestamp: new Date(Date.now() - (10 - blockHeight) * 10 * 1000),
    transactions: [`encrypted_tx_${blockHeight}_${Math.random().toString(36).substring(7)}`],
  };
}

/**
 * Decrypts a shielded transaction mock; In the real implementation, this would use the UFVK to decrypt.
 */
async function decryptShieldedTransactionMock(
  encryptedTxHash: string,
  blockHeight: number,
): Promise<ShieldedTransaction> {
  const zcash = new ZCash();
  const decryptedData = await zcash.decryptTransaction(encryptedTxHash);

  // Mock: Extract transaction details from decrypted data
  // 0.1 ZEC = 0.1 * 10^8 = 10000000 (ZEC has magnitude 8, same as Bitcoin)
  const value = "10000000"; // 0.1 ZEC
  const fee = "1000";
  const type = Math.random() > 0.5 ? "IN" : "OUT";

  return {
    hash: `shielded_tx_${blockHeight}_${Math.random().toString(36).substring(7)}`,
    blockHeight,
    blockHash: `block_${blockHeight}`,
    timestamp: new Date(),
    value,
    fee,
    type,
    senders: [`shielded_address_${blockHeight}`],
    recipients: [`shielded_address_${blockHeight + 1}`],
    encryptedData: encryptedTxHash,
    decryptedData,
  };
}

/**
 * Processes a block and extracts shielded transactions.
 */
async function processBlock(blockHeight: number): Promise<ShieldedTransaction[]> {
  console.log("RABL zcash/shielded", `Fetching block ${blockHeight} from blockchain`);
  const block = await fetchBlockMock(blockHeight);

  console.log(
    "RABL zcash/shielded",
    `Decrypting ${block.transactions.length} transactions in block ${blockHeight}`,
  );
  const transactions = await Promise.all(
    block.transactions.map(txHash => decryptShieldedTransactionMock(txHash, blockHeight)),
  );

  return transactions;
}

export function syncShielded(info: AccountShapeInfo<Account>): Observable<ShieldedSyncResult> {
  const { currency, initialAccount } = info;
  const BLOCKS_TO_SYNC = 10;
  const BLOCK_SYNC_DELAY_MS = 3000; // 3 seconds per block

  const startBlock = initialAccount?.blockHeight || 0;

  const currentSyncState = getShieldedSyncState(initialAccount);

  console.log("RABL zcash/shielded", `Starting shielded sync for ${currency.id}`, {
    startBlock,
    blocksToSync: BLOCKS_TO_SYNC,
    delayPerBlock: BLOCK_SYNC_DELAY_MS,
    currentSyncState,
  });

  if (currentSyncState & SHIELDED_SYNC_PAUSE) {
    console.log("RABL zcash/shielded", `Shielded sync is paused for ${currency.id}`);
    return EMPTY;
  }

  if (currentSyncState & SHIELDED_SYNC_COMPLETED) {
    console.log("RABL zcash/shielded", `Shielded sync already completed for ${currency.id}`);
    return EMPTY;
  }

  // Create an array of block numbers to sync
  const blocksToSync = Array.from({ length: BLOCKS_TO_SYNC }, (_, i) => startBlock + i + 1);

  // Helper function to check if sync should continue (not paused)
  const shouldContinueSync = (): boolean => {
    const syncState = getShieldedSyncState(initialAccount);
    const isPaused = !!(syncState & SHIELDED_SYNC_PAUSE);
    if (isPaused) {
      console.log("RABL zcash/shielded", `Shielded sync paused mid-process for ${currency.id}`);
    }
    return !isPaused;
  };

  // Create an Observable that emits one block number every BLOCK_SYNC_DELAY_MS
  return concat(
    ...blocksToSync.map((blockNumber, index) =>
      timer(index * BLOCK_SYNC_DELAY_MS, BLOCK_SYNC_DELAY_MS).pipe(
        take(1),
        map(() => blockNumber),
        tap(() => {
          // Check pause state before processing each block
          if (!shouldContinueSync()) {
            console.log("RABL zcash/shielded", `Skipping block ${blockNumber} - sync is paused`);
          } else {
            console.log(
              "RABL zcash/shielded",
              `Processing block ${blockNumber} (${index + 1}/${BLOCKS_TO_SYNC})`,
            );
          }
        }),
        // Process the block only if not paused
        mergeMap((blockNum: number) => {
          if (!shouldContinueSync()) {
            return EMPTY;
          }
          return from(processBlock(blockNum));
        }),
      ),
    ),
  ).pipe(
    // Accumulate transactions across ALL blocks
    scan(
      (
        accumulated: ShieldedSyncResult,
        newTransactions: ShieldedTransaction[],
      ): ShieldedSyncResult => {
        console.log(
          "RABL zcash/shielded",
          `Block processed, found ${newTransactions.length} transactions`,
          {
            blockHeight: newTransactions[0]?.blockHeight,
            totalOperations: accumulated.operations.length + newTransactions.length,
          },
        );

        return {
          operations: [...accumulated.operations, ...newTransactions],
          latestBlockHeight: newTransactions[0]?.blockHeight || accumulated.latestBlockHeight,
        };
      },
      {
        operations: [],
        latestBlockHeight: startBlock,
      } satisfies ShieldedSyncResult,
    ),
    tap((result: ShieldedSyncResult) => {
      console.log("RABL zcash/shielded", "Emitting shielded sync update", {
        blockHeight: result.latestBlockHeight,
        operationsCount: result.operations.length,
        syncState: SHIELDED_SYNC_IN_PROGRESS,
      });
    }),
    tap({
      complete: () => {
        console.log("RABL zcash/shielded", `Shielded sync completed for ${currency.id}`, {
          totalBlocks: BLOCKS_TO_SYNC,
          finalState: SHIELDED_SYNC_COMPLETED,
        });
      },
      error: (error: Error) => {
        console.log("RABL zcash/shielded", `Shielded sync error for ${currency.id}`, {
          error: error.message,
        });
      },
    }),
  );
}

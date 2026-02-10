import { fetchTxsWithPages, fetchERC20TransactionsWithPages } from "../network/api";
import { mapTxToOps } from "../common-logic/utils";
import { erc20TxnToOperation } from "../erc20/tokenAccounts";
import { encodeAccountId, encodeTokenAccountId } from "@ledgerhq/coin-framework/account";
import BigNumber from "bignumber.js";
import type { Operation as CoreOperation } from "@ledgerhq/coin-framework/api/index";
import type { Operation as LiveOperation } from "@ledgerhq/types-live";
import type { ListOperationsOptions } from "../types/model";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";

/**
 * List operations (transactions) for an address.
 *
 * Includes both native FIL transfers and ERC20 token transfers.
 *
 * @param address - The address to list operations for
 * @param options - Pagination and filtering options
 * @returns Tuple of [operations, nextCursor]
 */
export async function listOperations(
  address: string,
  options: ListOperationsOptions,
): Promise<[CoreOperation[], string]> {
  const { limit = 200, minHeight = 0, order = "asc" } = options;

  // Create a temporary accountId for mapping (required by mapTxToOps)
  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: "filecoin",
    xpubOrAddress: address,
    derivationMode: "",
  });

  // Fetch native and token transactions in parallel
  const [nativeTxs, erc20Txs] = await Promise.all([
    fetchTxsWithPages(address, minHeight),
    fetchERC20TransactionsWithPages(address, minHeight),
  ]);

  // Map native transactions using existing mapTxToOps
  const currency = getCryptoCurrencyById("filecoin");
  const mapperFn = mapTxToOps(accountId, {
    address,
    currency,
    index: 0,
    derivationPath: "44'/461'/0'/0/0",
    derivationMode: "",
  });
  const nativeLiveOps: LiveOperation[] = nativeTxs.flatMap(tx => mapperFn(tx));

  // Map ERC20 transactions to operations
  // Group by contract to get proper token account IDs
  // Note: Token operations are only included if the token is found in the crypto assets store.
  // Tokens not registered in the store will be silently skipped - this is intentional
  // as we only want to show operations for known/supported tokens.
  const tokenLiveOps: LiveOperation[] = [];
  for (const tx of erc20Txs) {
    const contractAddress = tx.contract_address.toLowerCase();
    const token = await getCryptoAssetsStore().findTokenByAddressInCurrency(
      contractAddress,
      "filecoin",
    );

    if (token) {
      const tokenAccountId = encodeTokenAccountId(accountId, token);
      const ops = erc20TxnToOperation(tx, address, tokenAccountId);
      tokenLiveOps.push(...ops);
    }
  }

  // Merge and sort operations
  const allLiveOps = [...nativeLiveOps, ...tokenLiveOps];
  allLiveOps.sort((a, b) => {
    const comparison = (a.blockHeight ?? 0) - (b.blockHeight ?? 0);
    return order === "asc" ? comparison : -comparison;
  });

  // Apply limit
  const limitedOps = allLiveOps.slice(0, limit);

  // Generate next cursor
  const nextCursor =
    limitedOps.length > 0 ? (limitedOps[limitedOps.length - 1].blockHeight ?? 0).toString() : "";

  // Adapt to coin-framework API Operation model
  return [limitedOps.map(adaptLiveOperationToCoreOperation), nextCursor];
}

/**
 * Adapt Ledger Live Operation to coin-framework API Operation model.
 * This is the inverse of adaptCoreOperationToLiveOperation in generic-alpaca/utils.ts
 */
function adaptLiveOperationToCoreOperation(op: LiveOperation): CoreOperation {
  // Determine asset type from accountId
  // Token account IDs contain a '+' separator followed by token info
  const isTokenOperation = op.accountId.includes("+");

  // Extract token contract from accountId if token operation
  // Format: js:2:filecoin:address:derivationMode+tokenId
  let asset: CoreOperation["asset"] = { type: "native" };
  if (isTokenOperation) {
    const parts = op.accountId.split("+");
    if (parts.length > 1) {
      // tokenId format: filecoin/erc20/contractAddress
      const tokenIdParts = parts[1].split("/");
      if (tokenIdParts.length >= 3) {
        asset = { type: "erc20", assetReference: tokenIdParts[2] };
      }
    }
  }

  // Convert BigNumber to BigInt safely (handle scientific notation)
  const valueBN = new BigNumber(op.value.toString());
  const feeBN = new BigNumber(op.fee?.toString() ?? "0");

  return {
    id: op.id,
    type: op.type,
    value: BigInt(valueBN.integerValue().toFixed()),
    senders: op.senders,
    recipients: op.recipients,
    asset,
    tx: {
      hash: op.hash,
      block: {
        height: op.blockHeight ?? 0,
        hash: op.blockHash ?? "",
      },
      date: op.date,
      fees: BigInt(feeBN.integerValue().toFixed()),
      failed: op.hasFailed ?? false,
    },
    details: (op.extra as Record<string, unknown>) ?? undefined,
  };
}

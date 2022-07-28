import { BigNumber } from "bignumber.js";
import union from "lodash/union";
import throttle from "lodash/throttle";
import flatMap from "lodash/flatMap";
import eip55 from "eip55";
import { log } from "@ledgerhq/logs";
import { mergeNfts, mergeOps } from "../../bridge/jsHelpers";
import type { GetAccountShape } from "../../bridge/jsHelpers";
import {
  encodeTokenAccountId,
  decodeTokenAccountId,
  areAllOperationsLoaded,
  inferSubOperations,
  emptyHistoryCache,
} from "../../account";
import { listTokensForCryptoCurrency } from "../../currencies";
import { encodeAccountId } from "../../account";
import type { Operation, TokenAccount, Account } from "@ledgerhq/types-live";
import { API, apiForCurrency, Tx } from "../../api/Ethereum";
import { digestTokenAccounts, prepareTokenAccounts } from "./modules";
import { findTokenByAddressInCurrency } from "@ledgerhq/cryptoassets";
import { encodeNftId, isNFTActive, nftsFromOperations } from "../../nft";
import { encodeOperationId, encodeSubOperationId } from "../../operation";
import {
  encodeERC1155OperationId,
  encodeERC721OperationId,
} from "../../nft/nftOperationId";

export const getAccountShape: GetAccountShape = async (
  infoInput,
  { blacklistedTokenIds }
) => {
  const { currency, initialAccount, derivationMode } = infoInput;
  let { address } = infoInput;
  address = eip55.encode(address);
  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });
  const api = apiForCurrency(currency);
  const initialStableOperations = initialAccount
    ? stableOperations(initialAccount)
    : [];
  // fetch transactions, incrementally if possible
  const mostRecentStableOperation = initialStableOperations[0];
  const currentBlockP = fetchCurrentBlock(currency);
  const balanceP = api.getAccountBalance(address);
  // when new tokens are added / blacklist changes, we need to sync again because we need to go through all operations again
  // Check if the block hash exists on chain to prevent reorg issue
  const blockHashExistsOnChain = await api
    .getBlockByHash(mostRecentStableOperation?.blockHash)
    .then(Boolean);
  const syncHash =
    JSON.stringify(blacklistedTokenIds || []) +
    "_" +
    listTokensForCryptoCurrency(currency, {
      withDelisted: true,
    }).length;
  const outdatedSyncHash = initialAccount?.syncHash !== syncHash;
  const pullFromBlockHash =
    initialAccount &&
    areAllOperationsLoaded(initialAccount) &&
    mostRecentStableOperation &&
    blockHashExistsOnChain &&
    !outdatedSyncHash
      ? mostRecentStableOperation.blockHash
      : undefined;
  const txsP = fetchAllTransactions(api, address, pullFromBlockHash);
  const [txs, currentBlock, balance] = await Promise.all([
    txsP,
    currentBlockP,
    balanceP,
  ]);
  const blockHeight = currentBlock.height.toNumber();

  if (!pullFromBlockHash && txs.length === 0) {
    log("ethereum", "no ops on " + address);
    return {
      id: accountId,
      balance,
      subAccounts: [],
      blockHeight,
    };
  }

  // transform transactions into operations
  let newOps = flatMap(txs, txToOps({ address, id: accountId, currency }));
  // extracting out the sub operations by token account
  const perTokenAccountIdOperations = {};
  newOps.forEach((op) => {
    const { subOperations } = op;

    if (subOperations?.length) {
      subOperations.forEach((sop) => {
        if (!perTokenAccountIdOperations[sop.accountId]) {
          perTokenAccountIdOperations[sop.accountId] = [];
        }

        perTokenAccountIdOperations[sop.accountId].push(sop);
      });
    }
  });
  const subAccountsExisting = {};
  initialAccount?.subAccounts?.forEach((a) => {
    // in case of coming from libcore, we need to converge to new ids
    const { token } = decodeTokenAccountId(a.id);
    if (!token) return;
    const id = encodeTokenAccountId(accountId, token);
    subAccountsExisting[id] = a;
  });
  const subAccountsExistingIds = Object.keys(subAccountsExisting);
  const perTokenAccountChangedIds = Object.keys(perTokenAccountIdOperations);
  log(
    "ethereum",
    `${address} reconciliate ${txs.length} txs => ${newOps.length} new ops. ${perTokenAccountChangedIds.length} updates into ${subAccountsExistingIds.length} token accounts`
  );
  // reconciliate token accounts
  let tokenAccounts: TokenAccount[] = union(
    subAccountsExistingIds,
    perTokenAccountChangedIds
  )
    .map((id) => {
      const existing = subAccountsExisting[id];
      const newOps = perTokenAccountIdOperations[id];
      const { accountId, token } = decodeTokenAccountId(id);

      if (
        !token ||
        (blacklistedTokenIds && blacklistedTokenIds.includes(token.id))
      ) {
        return null;
      }

      if (existing && !newOps) return existing;
      const existingOps = existing?.operations || [];
      const operations = newOps ? mergeOps(existingOps, newOps) : existingOps;
      const lastOperation = operations[operations.length - 1];
      const creationDate =
        existing?.creationDate ||
        (lastOperation ? lastOperation.date : new Date());
      const pendingOperations = existing?.pendingOperations || [];
      const starred = existing?.starred || false;
      const swapHistory = existing?.swapHistory || [];
      return {
        type: "TokenAccount",
        id,
        token,
        parentId: accountId,
        balance: existing?.balance || new BigNumber(0),
        // resolved in batched after this
        spendableBalance: existing?.balance || new BigNumber(0),
        // resolved in batched after this
        creationDate,
        operationsCount: operations.length,
        operations,
        pendingOperations,
        starred,
        swapHistory,
        balanceHistoryCache: emptyHistoryCache, // calculated in the jsHelpers
      };
    })
    .filter(Boolean);
  tokenAccounts = await prepareTokenAccounts(currency, tokenAccounts, address);
  tokenAccounts = await loadERC20Balances(tokenAccounts, address, api);
  tokenAccounts = await digestTokenAccounts(currency, tokenAccounts, address);
  const subAccounts = reconciliateSubAccounts(tokenAccounts, initialAccount);
  // has sub accounts have changed, we need to relink the subOperations
  newOps = newOps.map((o) => ({
    ...o,
    subOperations: inferSubOperations(o.hash, subAccounts),
  }));
  const operations = mergeOps(
    blockHashExistsOnChain ? initialStableOperations : [],
    newOps
  );

  const nfts = isNFTActive(currency)
    ? mergeNfts(
        initialAccount?.nfts || [],
        nftsFromOperations(
          mergeOps(operations, initialAccount?.pendingOperations || [])
        ).filter((n) => n.amount.gt(0))
      )
    : undefined;

  const accountShape: Partial<Account> = {
    id: accountId,
    operations,
    balance,
    subAccounts,
    spendableBalance: balance,
    blockHeight,
    lastSyncDate: new Date(),
    syncHash,
    nfts,
  };
  return accountShape;
};

const safeEncodeEIP55 = (addr) => {
  if (!addr || addr === "0x") return "";

  try {
    return eip55.encode(addr);
  } catch (e) {
    return "";
  }
};

// in case of a SELF send, 2 ops are returned.
const txToOps =
  ({ address, id, currency }) =>
  (tx: Tx): Operation[] => {
    // workaround bugs in our explorer that don't treat partial/optimistic operation really well
    if (!tx.gas_used) return [];
    const {
      hash,
      block,
      actions,
      transfer_events,
      erc721_transfer_events,
      erc1155_transfer_events,
    } = tx;
    const addr = address;
    const from = safeEncodeEIP55(tx.from);
    const to = safeEncodeEIP55(tx.to);
    const sending = addr === from;
    const receiving = addr === to;
    const value = new BigNumber(tx.value);
    const fee = new BigNumber(tx.gas_price).times(tx.gas_used || 0);
    const hasFailed = new BigNumber(tx.status || 0).eq(0);
    const blockHeight = block && block.height.toNumber();
    const blockHash = block && block.hash;
    const date = tx.received_at ? new Date(tx.received_at) : new Date();
    const transactionSequenceNumber = parseInt(tx.nonce);
    // Internal transactions
    const internalOperations: Operation[] = !actions
      ? []
      : (actions
          .map((action, i) => {
            const actionFrom = safeEncodeEIP55(action.from);
            const actionTo = safeEncodeEIP55(action.to);

            // Since explorer is considering also wrapping tx as an internal action,
            // we must filter it by considering that only internal action with same data,
            // sender and receiver, is the one representing/corresponding to wrapping tx
            if (
              actionFrom === from &&
              actionTo === to &&
              tx.value.eq(action.value)
            ) {
              return;
            }

            const receiving = addr === actionTo;
            const value = action.value;
            const fee = new BigNumber(0);

            if (receiving) {
              return {
                id: `${id}-${hash}-i${i}`,
                hash,
                type: "IN",
                value,
                fee,
                blockHeight,
                blockHash,
                accountId: id,
                senders: [actionFrom],
                recipients: [actionTo],
                date,
                extra: {},
                transactionSequenceNumber,
              };
            }
          })
          .filter(Boolean) as Operation[]);
    // We are putting the sub operations in place for now, but they will later be exploded out of the operations back to their token accounts
    const subOperations = !transfer_events
      ? []
      : flatMap(transfer_events.list, (event, i) => {
          const from = safeEncodeEIP55(event.from);
          const to = safeEncodeEIP55(event.to);
          const sending = addr === from;
          const receiving = addr === to;

          if (!sending && !receiving) {
            return [];
          }

          const token = findTokenByAddressInCurrency(
            event.contract,
            currency.id
          );
          if (!token) return [];
          const accountId = encodeTokenAccountId(id, token);
          const value = event.count;
          const all: Operation[] = [];

          if (sending) {
            const type = "OUT";
            all.push({
              id: encodeSubOperationId(accountId, hash, type, i),
              hash,
              type,
              value,
              fee,
              blockHeight,
              blockHash,
              accountId,
              senders: [from],
              recipients: [to],
              date,
              extra: {},
              transactionSequenceNumber,
            });
          }

          if (receiving) {
            const type = "IN";
            all.push({
              id: encodeSubOperationId(accountId, hash, type, i),
              hash,
              type,
              value,
              fee,
              blockHeight,
              blockHash,
              accountId,
              senders: [from],
              recipients: [to],
              date,
              extra: {},
              transactionSequenceNumber,
            });
          }

          return all;
        });

    // Creating NFTOps from transfer events related to ERC721 only
    const erc721Operations =
      !erc721_transfer_events || !isNFTActive(currency)
        ? []
        : flatMap(erc721_transfer_events, (event) => {
            const sender = safeEncodeEIP55(event.sender);
            const receiver = safeEncodeEIP55(event.receiver);
            const contract = safeEncodeEIP55(event.contract);
            const tokenId = event.token_id;
            const nftId = encodeNftId(id, event.contract, tokenId, currency.id);
            const sending = addr === sender;
            const receiving = addr === receiver;

            if (!sending && !receiving) {
              return [];
            }

            const all: Operation[] = [];

            if (sending) {
              const type = "NFT_OUT";
              all.push({
                id: encodeERC721OperationId(nftId, hash, type),
                senders: [sender],
                recipients: [receiver],
                contract,
                fee,
                standard: "ERC721",
                tokenId,
                value: new BigNumber(1),
                hash,
                type,
                blockHeight,
                blockHash,
                date,
                transactionSequenceNumber,
                accountId: id,
                extra: {},
              });
            }

            if (receiving) {
              const type = "NFT_IN";
              all.push({
                id: encodeERC721OperationId(nftId, hash, type),
                senders: [sender],
                recipients: [receiver],
                contract,
                fee,
                standard: "ERC721",
                tokenId,
                value: new BigNumber(1),
                hash,
                type,
                blockHeight,
                blockHash,
                date,
                transactionSequenceNumber,
                accountId: id,
                extra: {},
              });
            }

            return all;
          });

    // Creating NFTOps from transfer events related to ERC1155 only
    const erc1155Operations =
      !erc1155_transfer_events || !isNFTActive(currency)
        ? []
        : flatMap(erc1155_transfer_events, (event, i) => {
            const sender = safeEncodeEIP55(event.sender);
            const receiver = safeEncodeEIP55(event.receiver);
            const contract = safeEncodeEIP55(event.contract);
            const operator = safeEncodeEIP55(event.operator);
            const sending = addr === sender;
            const receiving = addr === receiver;

            if (!sending && !receiving) {
              return [];
            }

            const all: Operation[] = [];

            event.transfers.forEach((transfer, j) => {
              const tokenId = transfer.id;
              const value = new BigNumber(transfer.value);
              const nftId = encodeNftId(id, contract, tokenId, currency.id);

              if (sending) {
                const type = "NFT_OUT";
                all.push({
                  id: encodeERC1155OperationId(nftId, hash, type, i, j),
                  senders: [sender],
                  recipients: [receiver],
                  contract,
                  fee,
                  operator,
                  standard: "ERC1155",
                  tokenId,
                  value,
                  hash,
                  type,
                  blockHeight,
                  blockHash,
                  date,
                  transactionSequenceNumber,
                  accountId: id,
                  extra: {},
                });
              }

              if (receiving) {
                const type = "NFT_IN";
                all.push({
                  id: encodeERC1155OperationId(nftId, hash, type, i, j),
                  senders: [sender],
                  recipients: [receiver],
                  contract,
                  fee,
                  operator,
                  standard: "ERC1155",
                  tokenId,
                  value,
                  hash,
                  type,
                  blockHeight,
                  blockHash,
                  date,
                  transactionSequenceNumber,
                  accountId: id,
                  extra: {},
                });
              }
            });

            return all;
          });

    const nftOperations = erc721Operations
      .concat(erc1155Operations)
      /** @warning is this necessary ? Do we need the operations to be chronologically organised for LLD/LLM ? */
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    const ops: Operation[] = [];

    if (sending) {
      const type = value.eq(0) ? "FEES" : "OUT";
      ops.push({
        id: encodeOperationId(id, hash, type),
        hash,
        type,
        value: hasFailed ? new BigNumber(fee) : value.plus(fee),
        fee,
        blockHeight,
        blockHash,
        accountId: id,
        senders: [from],
        recipients: [to],
        date,
        extra: {},
        hasFailed,
        internalOperations: internalOperations,
        subOperations,
        nftOperations,
        transactionSequenceNumber,
      });
    }

    if (receiving) {
      const type = "IN";
      ops.push({
        id: encodeOperationId(id, hash, type),
        hash: hash,
        type,
        value,
        fee,
        blockHeight,
        blockHash,
        accountId: id,
        senders: [from],
        recipients: [to],
        date: new Date(date.getTime() + 1),
        // hack: make the IN appear after the OUT in history.
        extra: {},
        internalOperations: sending ? [] : internalOperations,
        // if it was already in sending, we don't add twice
        subOperations: sending ? [] : subOperations,
        nftOperations,
        transactionSequenceNumber,
      });
    }

    if (
      !sending &&
      !receiving &&
      (internalOperations.length ||
        subOperations.length ||
        nftOperations.length)
    ) {
      const type = "NONE";
      ops.push({
        id: encodeOperationId(id, hash, type),
        hash: hash,
        type,
        value: new BigNumber(0),
        fee,
        blockHeight,
        blockHash,
        accountId: id,
        senders: [from],
        recipients: [to],
        date,
        extra: {},
        internalOperations,
        subOperations,
        nftOperations,
        transactionSequenceNumber,
      });
    }

    return ops;
  };

const fetchCurrentBlock = ((perCurrencyId) => (currency) => {
  if (perCurrencyId[currency.id]) return perCurrencyId[currency.id]();
  const api = apiForCurrency(currency);
  const f = throttle(
    () =>
      api.getCurrentBlock().catch((e) => {
        f.cancel();
        throw e;
      }),
    5000
  );
  perCurrencyId[currency.id] = f;
  return f();
})({});

// FIXME we need to figure out how to optimize this
// but nothing can easily be done until we have a better api
const fetchAllTransactions = async (api: API, address, blockHash) => {
  let r;
  let txs: Tx[] = [];
  let maxIteration = 20; // safe limit

  do {
    r = await api.getTransactions(address, blockHash);
    if (r.txs.length === 0) return txs;
    txs = txs.concat(r.txs);
    blockHash = txs[txs.length - 1].block?.hash;

    if (!blockHash) {
      log("ethereum", "block.hash missing!");
      return txs;
    }
  } while (--maxIteration);

  return txs;
};

async function loadERC20Balances(tokenAccounts, address, api) {
  const erc20balances = await api.getERC20Balances(
    tokenAccounts.map(({ token }) => ({
      contract: token.contractAddress,
      address,
    }))
  );
  return tokenAccounts
    .map((a) => {
      const r = erc20balances.find(
        (b) =>
          b.contract &&
          b.balance &&
          b.contract.toLowerCase() === a.token.contractAddress.toLowerCase()
      );

      if (!r) {
        // when backend have failed in the balance, the TokenAccount should be dropped because it likely means the token no longer is valid.
        return null;
      }

      if (!a.balance.eq(r.balance)) {
        return { ...a, balance: r.balance, spendableBalance: r.balance };
      }

      return a;
    })
    .filter(Boolean);
}

const SAFE_REORG_THRESHOLD = 80;

function stableOperations(a) {
  return a.operations.filter(
    (op) =>
      op.blockHeight && a.blockHeight - op.blockHeight > SAFE_REORG_THRESHOLD
  );
}

// reconciliate the existing token accounts so that refs don't change if no changes is contained
function reconciliateSubAccounts(tokenAccounts, initialAccount) {
  let subAccounts;

  if (initialAccount) {
    const initialSubAccounts = initialAccount.subAccounts;
    let anySubAccountHaveChanged = false;
    const stats: string[] = [];

    if (
      initialSubAccounts &&
      tokenAccounts.length !== initialSubAccounts.length
    ) {
      stats.push("length differ");
      anySubAccountHaveChanged = true;
    }

    subAccounts = tokenAccounts.map((ta) => {
      const existing = initialSubAccounts?.find((a) => a.id === ta.id);

      if (existing) {
        let shallowEqual = true;

        if (existing !== ta) {
          for (const k in existing) {
            if (existing[k] !== ta[k]) {
              shallowEqual = false;
              stats.push(`field ${k} changed for ${ta.id}`);
              break;
            }
          }
        }

        if (shallowEqual) {
          return existing;
        } else {
          anySubAccountHaveChanged = true;
        }
      } else {
        anySubAccountHaveChanged = true;
        stats.push(`new token account ${ta.id}`);
      }

      return ta;
    });

    if (!anySubAccountHaveChanged && initialSubAccounts) {
      log(
        "ethereum",
        "incremental sync: " +
          String(initialSubAccounts.length) +
          " sub accounts have not changed"
      );
      subAccounts = initialSubAccounts;
    } else {
      log(
        "ethereum",
        "incremental sync: sub accounts changed: " + stats.join(", ")
      );
    }
  } else {
    subAccounts = tokenAccounts.map((a) => a);
  }

  return subAccounts;
}

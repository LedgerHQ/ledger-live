// @flow

import isEqual from "lodash/isEqual";
import last from "lodash/last";
import {
  encodeAccountId,
  getAccountPlaceholderName,
  getNewAccountPlaceholderName
} from "../../account";
import type {
  TokenAccount,
  Account,
  Operation,
  CryptoCurrency,
  DerivationMode
} from "../../types";
import {
  libcoreAmountToBigNumber,
  libcoreBigIntToBigNumber
} from "../buildBigNumber";
import type {
  CoreWallet,
  CoreAccount,
  CoreOperation,
  CoreEthereumLikeAccount,
  CoreERC20LikeAccount
} from "../types";
import { log } from "../../logs";
import { buildOperation } from "./buildOperation";
import { buildERC20Operation } from "./buildERC20Operation";
import { findTokenByAddress } from "../../currencies";

const sameImmutableOp = (a: Operation, b: Operation) =>
  a === b ||
  (a.id === b.id && // hash, accountId, type are in id
    a.date.getTime() === b.date.getTime() &&
    (a.fee ? a.fee.isEqualTo(b.fee) : a.fee === b.fee) &&
    (a.value ? a.value.isEqualTo(b.value) : a.value === b.value) &&
    isEqual(a.senders, b.senders) &&
    isEqual(a.recipients, b.recipients));

function findExistingOp(ops, op) {
  return ops.find(o => o.id === op.id);
}

async function minimalOperationsBuilder<CO>(
  existingOperations: Operation[],
  coreOperations: CO[],
  buildOp: (coreOperation: CO) => Promise<Operation>
) {
  // build operations with the minimal diff & call to libcore possible
  let operations = [];
  let existingOps = existingOperations || [];

  let immutableOpCmpDoneOnce = false;
  for (let i = coreOperations.length - 1; i >= 0; i--) {
    const coreOperation = coreOperations[i];
    const newOp = await buildOp(coreOperation);
    const existingOp = findExistingOp(existingOps, newOp);

    if (existingOp && !immutableOpCmpDoneOnce) {
      // an Operation is supposely immutable.
      if (existingOp.blockHeight !== newOp.blockHeight) {
        // except for blockHeight that can temporarily be null
        operations.push(newOp);
        continue; // eslint-disable-line no-continue
      } else {
        immutableOpCmpDoneOnce = true;
        // we still check the first existing op we meet...
        if (!sameImmutableOp(existingOp, newOp)) {
          // this implement a failsafe in case an op changes (when we fix bugs)
          // tradeoff: in such case, we assume all existingOps are to trash
          console.warn("op mismatch. doing a full clear cache.");
          existingOps = [];
          operations.push(newOp);
          continue; // eslint-disable-line no-continue
        }
      }
    }

    if (existingOp) {
      // as soon as we've found a first matching op in old op list,
      const j = existingOps.indexOf(existingOp);
      const rest = existingOps.slice(j);
      if (rest.length !== i + 1) {
        // if libcore happen to have different number of ops that what we have,
        // we actualy need to continue because we don't know where hole will be,
        // but we can keep existingOp
        operations.push(existingOp);
      } else {
        // otherwise we stop the libcore iteration and continue with previous data
        // and we're done on the iteration
        if (operations.length === 0 && j === 0) {
          // special case: we preserve the operations array as much as possible
          operations = existingOps;
        } else {
          operations = operations.concat(rest);
        }
        break;
      }
    } else {
      // otherwise it's a new op
      operations.push(newOp);
    }
  }
  return operations;
}

async function buildERC20TokenAccount({
  parentAccountId,
  token,
  coreTokenAccount,
  existingTokenAccount
}) {
  const balance = await libcoreBigIntToBigNumber(
    await coreTokenAccount.getBalance()
  );
  const coreOperations = await coreTokenAccount.getOperations();

  const id = parentAccountId + "|" + token.id;

  const operations = await minimalOperationsBuilder(
    (existingTokenAccount && existingTokenAccount.operations) || [],
    coreOperations,
    coreOperation =>
      buildERC20Operation({
        coreOperation,
        accountId: id,
        token
      })
  );

  const tokenAccount: $Exact<TokenAccount> = {
    id,
    token,
    operations,
    balance
  };

  return tokenAccount;
}

export async function buildAccount({
  coreWallet,
  coreAccount,
  coreOperations,
  currency,
  accountIndex,
  derivationMode,
  seedIdentifier,
  existingAccount
}: {
  coreWallet: CoreWallet,
  coreAccount: CoreAccount,
  coreOperations: CoreOperation[],
  currency: CryptoCurrency,
  accountIndex: number,
  derivationMode: DerivationMode,
  seedIdentifier: string,
  existingAccount: ?Account
}) {
  const nativeBalance = await coreAccount.getBalance();
  const balance = await libcoreAmountToBigNumber(nativeBalance);

  const coreAccountCreationInfo = await coreWallet.getAccountCreationInfo(
    accountIndex
  );

  const derivations = await coreAccountCreationInfo.getDerivations();
  const accountPath = last(derivations);

  const coreBlock = await coreAccount.getLastBlock();
  const blockHeight = await coreBlock.getHeight();

  const freshAddresses = await coreAccount.getFreshPublicAddresses();
  const [coreFreshAddress] = freshAddresses;
  if (!coreFreshAddress) throw new Error("expected at least one fresh address");
  const [freshAddressStr, freshAddressPath] = await Promise.all([
    coreFreshAddress.toString(),
    coreFreshAddress.getDerivationPath()
  ]);
  if (!freshAddressPath) {
    log(
      "libcore",
      "freshAddressPath=" +
        String(freshAddressPath) +
        " freshAddress=" +
        String(freshAddressStr)
    );
    throw new Error("expected freshAddressPath");
  }
  const freshAddress = {
    str: freshAddressStr,
    path: `${accountPath}/${freshAddressPath}`
  };

  const name =
    coreOperations.length === 0
      ? getNewAccountPlaceholderName({
          currency,
          index: accountIndex,
          derivationMode
        })
      : getAccountPlaceholderName({
          currency,
          index: accountIndex,
          derivationMode
        });

  // retrieve xpub
  const xpub = await coreAccount.getRestoreKey();

  const accountId = encodeAccountId({
    type: "libcore",
    version: "1",
    currencyId: currency.id,
    xpubOrAddress: xpub,
    derivationMode
  });

  const operations = await minimalOperationsBuilder(
    (existingAccount && existingAccount.operations) || [],
    coreOperations,
    coreOperation =>
      buildOperation({
        coreOperation,
        accountId,
        currency
      })
  );

  let tokenAccounts;
  if (currency.family === "ethereum") {
    tokenAccounts = [];
    const ethAccount: CoreEthereumLikeAccount = await coreAccount.asEthereumLikeAccount();
    const coreTAS: CoreERC20LikeAccount[] = await ethAccount.getERC20Accounts();
    for (const coreTA of coreTAS) {
      const coreToken = await coreTA.getToken();
      const contractAddress = await coreToken.getContractAddress();
      const token = findTokenByAddress(contractAddress);
      if (token) {
        const existingTokenAccount =
          existingAccount &&
          existingAccount.tokenAccounts &&
          existingAccount.tokenAccounts.find(a => a.token === token);
        const tokenAccount = await buildERC20TokenAccount({
          parentAccountId: accountId,
          existingTokenAccount,
          token,
          coreTokenAccount: coreTA
        });
        tokenAccounts.push(tokenAccount);
      }
    }
  }

  const account: $Exact<Account> = {
    id: accountId,
    seedIdentifier,
    xpub,
    derivationMode,
    index: accountIndex,
    freshAddress: freshAddress.str,
    freshAddressPath: freshAddress.path,
    name,
    balance,
    blockHeight,
    currency,
    unit: currency.units[0],
    operations,
    pendingOperations: [],
    lastSyncDate: new Date(),
    tokenAccounts
  };

  return account;
}

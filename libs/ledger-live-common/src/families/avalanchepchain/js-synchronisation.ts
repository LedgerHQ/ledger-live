import { encodeAccountId } from "../../account";
import {
  makeSync,
  makeScanAccounts,
  GetAccountShape,
  mergeOps,
} from "../../bridge/jsHelpers";
import { getAccount, getOperations, getDelegations } from "./api";
import { AvalanchePChainAccount } from "./types";

const getAccountShape: GetAccountShape = async (info) => {
  const { address, initialAccount, currency, derivationMode } = info;

  const publicKey =
    (info.initialAccount as AvalanchePChainAccount)?.avalanchePChainResources
      ?.publicKey || info.rest?.publicKey;

  const chainCode =
    (info.initialAccount as AvalanchePChainAccount)?.avalanchePChainResources
      ?.chainCode || info.rest?.chainCode;

  const oldOperations = initialAccount?.operations || [];

  const startAt = oldOperations.length
    ? (oldOperations[0].blockHeight || 0) + 1
    : 0;

  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });

  const { balance, stakedBalance, blockHeight } = await getAccount(
    publicKey,
    chainCode
  );
  const delegations = await getDelegations(publicKey, chainCode);

  const newOperations = await getOperations(
    startAt,
    accountId,
    publicKey,
    chainCode
  );
  const operations = mergeOps(oldOperations, newOperations);

  const shape = {
    id: accountId,
    balance: balance.plus(stakedBalance),
    spendableBalance: balance,
    operationsCount: operations.length,
    blockHeight,
    operations,
    avalanchePChainResources: {
      publicKey,
      chainCode,
      stakedBalance,
      delegations,
    },
  };

  return shape;
};

export const scanAccounts = makeScanAccounts({ getAccountShape });
export const sync = makeSync({ getAccountShape });

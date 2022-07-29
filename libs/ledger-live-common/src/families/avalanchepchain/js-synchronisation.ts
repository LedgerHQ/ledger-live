import { encodeAccountId } from "../../account";
import {
  makeSync,
  makeScanAccounts,
  GetAccountShape,
  mergeOps,
} from "../../bridge/jsHelpers";
import { getAccount, getOperations, getDelegations } from "./api";
import { HDHelper } from "./hdhelper";

const getAccountShape: GetAccountShape = async (info) => {
  const { address, initialAccount, currency, derivationMode } = info;

  const publicKey =
    info.rest?.publicKey ||
    info.initialAccount?.avalanchePChainResources?.publicKey;
  const chainCode =
    info.rest?.chainCode ||
    info.initialAccount?.avalanchePChainResources?.chainCode;

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

  await HDHelper.instantiate(publicKey, chainCode);

  const { balance, stakedBalance, blockHeight } = await getAccount();
  const delegations = await getDelegations();

  let operations = oldOperations;

  const newOperations = await getOperations(startAt, accountId);

  operations = mergeOps(operations, newOperations);

  const shape = {
    id: accountId,
    balance: balance.plus(stakedBalance),
    spendableBalance: balance,
    operationsCount: operations.length,
    blockHeight,
    avalanchePChainResources: {
      publicKey,
      chainCode,
      stakedBalance,
      delegations,
    },
  };

  return {
    ...shape,
    operations,
  };
};

export const scanAccounts = makeScanAccounts({ getAccountShape });
export const sync = makeSync({ getAccountShape });

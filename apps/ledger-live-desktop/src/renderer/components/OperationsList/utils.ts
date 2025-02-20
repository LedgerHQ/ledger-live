import { startOfDay } from "@ledgerhq/coin-framework/lib-es/account/balanceHistoryCache";
import { getAccountCurrency } from "@ledgerhq/coin-framework/lib-es/account/helpers";
import { flattenOperationWithInternalsAndNfts } from "@ledgerhq/coin-framework/lib-es/operation";
import { NFTOperations } from "@ledgerhq/live-nft/lib-es/types";
import { AccountLike, Operation } from "@ledgerhq/types-live";
type AccountMap = Record<string, AccountLike>;

type CustomNFTOperations = NFTOperations & { operation: Operation };

type OrderedOperation = Operation & { order: number };

export const parseAccountOperations = (operations: Operation[] | undefined) =>
  operations
    .map(flattenOperationWithInternalsAndNfts)
    .filter(op => op.length)
    .flat()
    ?.sort((op1: Operation, op2: Operation) => {
      return (
        op1.date > op2.date ||
        (op1.date === op2.date &&
          op1.transactionSequenceNumber !== undefined &&
          op2.transactionSequenceNumber !== undefined &&
          op1.transactionSequenceNumber > op2.transactionSequenceNumber)
      );
    })
    ?.map((o, index) => ({ ...o, order: index }));

export const splitNftOperationsFromAllOperations = (operations: Operation[] | undefined) => {
  const { opsWithoutNFTIN, opsWithNFTIN } = operations?.reduce(
    (acc, op) => {
      if (op.type === "NFT_IN") {
        acc.opsWithNFTIN.push(op);
      } else {
        acc.opsWithoutNFTIN.push(op);
      }
      return acc;
    },
    { opsWithoutNFTIN: [], opsWithNFTIN: [] },
  ) || { opsWithoutNFTIN: [], opsWithNFTIN: [] };
  return { opsWithoutNFTIN, opsWithNFTIN };
};

export const groupOperationsByDate = (ops: Operation[]) =>
  ops.reduce(
    (acc, op) => {
      const date = startOfDay(new Date(op.date));
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(op);
      return acc;
    },
    {} as Record<string, Operation[]>,
  );

// alternative to getFilteredNftOperations that make processing before reducing

export function buildContractIndexNftOperations(
  operations: Operation[],
  accountsMap: AccountMap,
): CustomNFTOperations {
  return operations?.reduce((acc: NFTOperations, operation: Operation): CustomNFTOperations => {
    const account = accountsMap[operation.accountId];
    const contract = operation.contract || "";
    //acc[`${operation?.index}_${contract}`] = {
    acc[contract] = {
      contract,
      currencyId: getAccountCurrency(account).id,
      operation,
    };

    return acc;
  }, {});
}

export const buildCurrentOperationsPage = (
  noneSpamNftOperations: OrderedOperation[],
  otherOperations: OrderedOperation[],
  limit: number,
) => {
  const mergedOps = [...noneSpamNftOperations, ...otherOperations].sort(
    (a, b) => a.order - b.order,
  );
  return mergedOps.slice(0, limit);
};

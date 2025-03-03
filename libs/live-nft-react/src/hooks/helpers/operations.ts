import { startOfDay } from "@ledgerhq/coin-framework/account/balanceHistoryCache";
import { getAccountCurrency } from "@ledgerhq/coin-framework/account/helpers";
import { flattenOperationWithInternalsAndNfts } from "@ledgerhq/coin-framework/operation";
import { AccountLike, Operation } from "@ledgerhq/types-live";
type AccountMap = Record<string, AccountLike>;

type CustomNFTOperations = Record<
  string,
  {
    contract: string;
    currencyId: string;
    operation: Operation;
  }
>;

type OrderedOperation = Operation & { order: number };

type Section = {
  day: Date;
  data: Operation[];
};

export function compareOps(op1: Operation, op2: Operation): number {
  const dateComparison = op2.date.getTime() - op1.date.getTime();
  if (dateComparison !== 0) {
    return dateComparison;
  }
  if (op1.transactionSequenceNumber !== undefined && op2.transactionSequenceNumber !== undefined) {
    return op2.transactionSequenceNumber - op1.transactionSequenceNumber;
  }

  return 0;
}

export const parseAccountOperations = (operations: Operation[] | undefined) =>
  (operations || [])
    .map(flattenOperationWithInternalsAndNfts)
    .filter(op => op.length)
    .flat()
    ?.sort((op1: Operation, op2: Operation) => compareOps(op1, op2))
    ?.map((o, index) => ({ ...o, order: index }));

export const splitNftOperationsFromAllOperations = (operations: OrderedOperation[] | undefined) => {
  const { opsWithoutNFTIN, opsWithNFTIN } = operations?.reduce(
    (acc: { opsWithoutNFTIN: OrderedOperation[]; opsWithNFTIN: OrderedOperation[] }, op) => {
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
      const date = startOfDay(new Date(op.date)).getTime();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(op);
      return acc;
    },
    {} as Record<string, Operation[]>,
  );

export const groupOperationsByDateWithSections = (ops: Operation[]): { sections: Section[] } => {
  const groupedOps = ops.reduce(
    (acc, op) => {
      const date = startOfDay(new Date(op.date)).toISOString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(op);
      return acc;
    },
    {} as Record<string, Operation[]>,
  );

  const sections = Object.keys(groupedOps).map(date => ({
    day: new Date(date),
    data: groupedOps[date],
  }));

  return { sections };
};
// alternative to getFilteredNftOperations that make processing before reducing

export function buildContractIndexNftOperations(
  operations: Operation[],
  accountsMap: AccountMap,
): CustomNFTOperations {
  return operations?.reduce(
    (acc: CustomNFTOperations, operation: Operation): CustomNFTOperations => {
      const account = accountsMap[operation.accountId];
      const contract = operation.contract || "";
      acc[`${contract}`] = {
        contract,
        currencyId: getAccountCurrency(account).id,
        operation,
      };

      return acc;
    },
    {},
  );
}

export const buildCurrentOperationsPage = (
  noneSpamNftOperations: OrderedOperation[],
  otherOperations: OrderedOperation[],
  limit: number,
): OrderedOperation[] => {
  const mergedOps = [...noneSpamNftOperations, ...otherOperations].sort(
    (a, b) => a.order - b.order,
  );
  return mergedOps.slice(0, limit);
};

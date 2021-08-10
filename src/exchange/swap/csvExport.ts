import { formatCurrencyUnit } from "../../currencies";
import { getAccountCurrency, getMainAccount } from "../../account";
import type { SwapHistorySection, MappedSwapOperation } from "./types";
type Field = {
  title: string;
  cell: (arg0: MappedSwapOperation) => string;
};
const newLine = "\r\n";
const fields: Field[] = [
  {
    title: "Operator",
    cell: ({ provider }) => provider,
  },
  {
    title: "Swap ID",
    cell: ({ swapId }) => swapId,
  },
  {
    title: "From",
    cell: ({ fromAccount }) => getAccountCurrency(fromAccount).ticker,
  },
  {
    title: "To",
    cell: ({ toAccount }) => getAccountCurrency(toAccount).ticker,
  },
  {
    title: "From Value",
    cell: ({ fromAccount, fromAmount }) =>
      formatCurrencyUnit(getAccountCurrency(fromAccount).units[0], fromAmount, {
        disableRounding: true,
        useGrouping: false,
      }),
  },
  {
    title: "To Value",
    cell: ({ toAccount, toAmount }) =>
      formatCurrencyUnit(getAccountCurrency(toAccount).units[0], toAmount, {
        disableRounding: true,
        useGrouping: false,
      }),
  },
  {
    title: "Status",
    cell: ({ status }) => status,
  },
  {
    title: "Date",
    cell: ({ operation }) => operation.date.toISOString(),
  },
  {
    title: "From account",
    cell: ({ fromAccount, fromParentAccount }) =>
      getMainAccount(fromAccount, fromParentAccount).name,
  },
  {
    title: "From account address",
    cell: ({ fromAccount, fromParentAccount }) => {
      const main = getMainAccount(fromAccount, fromParentAccount);
      return main.freshAddress;
    },
  },
  {
    title: "To account",
    cell: ({ toAccount, toParentAccount }) =>
      getMainAccount(toAccount, toParentAccount).name,
  },
  {
    title: "To account address",
    cell: ({ toAccount, toParentAccount }) => {
      const main = getMainAccount(toAccount, toParentAccount);
      return main.freshAddress;
    },
  },
];
export const mappedSwapOperationsToCSV = (
  swapHistorySections: SwapHistorySection[]
): string => {
  const mappedSwapOperations: MappedSwapOperation[] = [];

  for (const section of swapHistorySections) {
    mappedSwapOperations.push(...section.data);
  }

  return (
    fields.map((field) => field.title).join(",") +
    newLine +
    mappedSwapOperations
      .map((op) =>
        fields.map((field) => field.cell(op).replace(/[,\n\r]/g, "")).join(",")
      )
      .join(newLine)
  );
};

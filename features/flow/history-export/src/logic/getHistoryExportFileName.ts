const pad = (value: number) => String(value).padStart(2, "0");

/** Local date, without extension: the mobile share sheet adds `.csv` from the `text/csv` type. */
export const getHistoryExportFileName = (date: Date) =>
  `ledgerwallet-operations-${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;

export type AdvancedLogsInput = Readonly<{
  xpub?: string;
  index: number;
  freshAddressPath: string;
  id: string;
  blockHeight: number;
  lastSyncDate: Date;
}>;

export type AdvancedLogs = Readonly<{
  json: string;
  syncDate: string;
}>;

export function buildAdvancedLogs(input: AdvancedLogsInput, locale: string): AdvancedLogs {
  const { xpub, index, freshAddressPath, id, blockHeight, lastSyncDate } = input;

  return {
    json: JSON.stringify({ xpub, index, freshAddressPath, id, blockHeight }, null, 2),
    syncDate: new Intl.DateTimeFormat(locale, { dateStyle: "long", timeStyle: "short" }).format(
      lastSyncDate,
    ),
  };
}

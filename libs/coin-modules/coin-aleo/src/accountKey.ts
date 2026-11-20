/** The account key of an Aleo account descriptor: its address, then its view key once the device gave it. */
export type AleoAccountKey = { address: string; viewKey?: string };

const SEPARATOR = ".";

export function composeAccountKey({ address, viewKey }: AleoAccountKey): string {
  return viewKey ? `${address}${SEPARATOR}${viewKey}` : address;
}

export function splitAccountKey(key: string): AleoAccountKey {
  const at = key.indexOf(SEPARATOR);
  return at === -1 ? { address: key } : { address: key.slice(0, at), viewKey: key.slice(at + 1) };
}

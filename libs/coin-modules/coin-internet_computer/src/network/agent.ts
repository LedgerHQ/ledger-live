import { HttpAgent } from "@dfinity/agent";

// The root key only needs fetching against a local replica; mainnet uses the embedded key,
// and the module's queries are uncertified, so skip the extra status round-trip there.
const isLocalHost = (host: string): boolean => {
  try {
    const { hostname } = new URL(host);
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
  } catch {
    return false;
  }
};

export const getAgent = (host: string) =>
  HttpAgent.create({ host, shouldFetchRootKey: isLocalHost(host) });

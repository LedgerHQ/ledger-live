import { Connection, GetProgramAccountsFilter, PublicKey } from "@solana/web3.js";
import type { KyInstance } from "ky";

type ParsedProgramAccounts = Awaited<ReturnType<Connection["getParsedProgramAccounts"]>>;

type ParsedAccount = ParsedProgramAccounts[number]["account"];

// Same entries as V1, except the raw RPC hands back base58 strings where web3.js
// parses PublicKeys.
type RawAccount = {
  pubkey: string;
  account: Omit<ParsedAccount, "owner"> & { owner: string };
};

type V2Response =
  | {
      result: {
        accounts: RawAccount[];
        // absent on agave, null on Helius, a cursor while more pages remain
        paginationKey?: string | null;
      };
      error?: undefined;
    }
  | { result?: undefined; error: { code: number; message: string } };

// https://www.jsonrpc.org/specification#error_object
const METHOD_NOT_FOUND = -32601;

// Bounded because our ky instance has no timeout: an endpoint stuck on the same cursor
// would otherwise hang the sync forever. Raise it if a legitimate account ever hits it.
const MAX_PAGES = 100;

/**
 * Paginated drop-in for `Connection.getParsedProgramAccounts`.
 *
 * Helius deprioritizes large getProgramAccounts requests and wants the paginated
 * getProgramAccountsV2 instead, but V2 is a Helius extension rather than standard Solana
 * RPC: vanilla agave answers -32601, which covers devnet and testnet (clusterApiUrl, see
 * endpointByCurrencyId), the coin tester's local validator, and any provider we fail over
 * to through the remotely configurable rpcUrls. So we try V2 and fall back to V1.
 * web3.js has no helper for V2, hence the raw JSON-RPC call.
 *
 * @see https://www.helius.dev/docs/api-reference/rpc/http/getprogramaccountsv2
 */
export const paginatedProgramAccounts = (
  connection: Connection,
  endpoint: string,
  http: KyInstance,
  logger?: (url: string, options: unknown) => void,
) => ({
  getParsedProgramAccounts: async (
    programId: PublicKey,
    { filters }: { filters: GetProgramAccountsFilter[] },
  ): Promise<ParsedProgramAccounts> => {
    const accounts: ParsedProgramAccounts = [];
    let paginationKey: string | undefined;

    for (let page = 0; page < MAX_PAGES; page++) {
      const body = {
        jsonrpc: "2.0",
        id: 1,
        method: "getProgramAccountsV2",
        params: [
          programId.toBase58(),
          {
            encoding: "jsonParsed",
            // Connection is built with "confirmed"; keep the raw call consistent.
            commitment: "confirmed",
            limit: 1000, // Helius recommends 1000-5000; one page covers any real account
            filters,
            paginationKey, // dropped from the JSON while undefined
          },
        ],
      };
      // Connection requests are logged through fetchMiddleware; mirror it here so this
      // raw call still shows up in the network log (see bridge/js.ts httpRequestLogger).
      logger?.(endpoint, { method: "POST", body: JSON.stringify(body) });

      const { result, error }: V2Response = await http.post(endpoint, { json: body }).json();

      if (error) {
        // No V2 here, and V1 returns the whole set in one call.
        if (error.code === METHOD_NOT_FOUND)
          return connection.getParsedProgramAccounts(programId, { filters });
        throw new Error(error.message);
      }

      accounts.push(
        ...result.accounts.map(({ pubkey, account }) => ({
          pubkey: new PublicKey(pubkey),
          account: { ...account, owner: new PublicKey(account.owner) },
        })),
      );

      // Filtering can empty a page while more remain, so the cursor is the only
      // end-of-pagination signal.
      paginationKey = result.paginationKey ?? undefined;
      if (!paginationKey) return accounts;
    }

    // Never truncate silently: a partial stake list would under-report the balance.
    throw new Error(`getProgramAccountsV2 exceeded ${MAX_PAGES} pages`);
  },
});

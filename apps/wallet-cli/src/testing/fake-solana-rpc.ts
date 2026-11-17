import type { Route } from "./mock-server";

const STAKE_PROGRAM = "Stake11111111111111111111111111111111111111";
const SPL_TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const SYSTEM_PROGRAM = "11111111111111111111111111111111";
/** `deactivationEpoch` of a stake that was never deactivated (u64::MAX). */
const NEVER = "18446744073709551615";
export const SOLANA_EPOCH = 500;
export const STAKE_RENT = 2_282_880;

type RpcCall = { jsonrpc: "2.0"; id: unknown; method: string; params?: unknown[] };

export type TokenAccountSpec = { address: string; mint: string; amount: string; decimals: number };

/** An SPL token account the node lists for `owner`, as `jsonParsed` encodes it. */
function parsedTokenAccount(owner: string, { address, mint, amount, decimals }: TokenAccountSpec) {
  const uiAmount = Number(amount) / 10 ** decimals;
  const tokenAmount = { amount, decimals, uiAmount, uiAmountString: String(uiAmount) };
  return {
    pubkey: address,
    account: {
      lamports: 2_039_280,
      owner: SPL_TOKEN_PROGRAM,
      executable: false,
      rentEpoch: 0,
      space: 165,
      data: {
        program: "spl-token",
        parsed: {
          type: "account",
          info: { mint, owner, tokenAmount, state: "initialized", isNative: false },
        },
        space: 165,
      },
    },
  };
}

export type StakeAccountSpec = {
  address: string;
  lamports: number;
  /** The vote account it delegates to; none for a stake account that was never delegated. */
  validator?: string;
  /** Epoch it was deactivated in; unset while it stays delegated. */
  deactivationEpoch?: number;
};

/** A stake account the node lists for `owner`, as `jsonParsed` encodes it. */
function parsedStakeAccount(owner: string, spec: StakeAccountSpec) {
  const meta = {
    rentExemptReserve: String(STAKE_RENT),
    authorized: { staker: owner, withdrawer: owner },
    lockup: { unixTimestamp: 0, epoch: 0, custodian: SYSTEM_PROGRAM },
  };
  const stake = spec.validator
    ? {
        delegation: {
          voter: spec.validator,
          stake: String(spec.lamports - STAKE_RENT),
          activationEpoch: "100",
          deactivationEpoch:
            spec.deactivationEpoch === undefined ? NEVER : String(spec.deactivationEpoch),
        },
        creditsObserved: 0,
      }
    : null;
  return {
    pubkey: spec.address,
    account: {
      lamports: spec.lamports,
      owner: STAKE_PROGRAM,
      executable: false,
      rentEpoch: 0,
      space: 200,
      data: {
        program: "stake",
        parsed: { type: stake ? "delegated" : "initialized", info: { meta, stake } },
        space: 200,
      },
    },
  };
}

/**
 * The Solana node and the Ledger services a Solana bridge sync calls, answering for one account:
 * its SOL balance, its token and stake accounts, and the JSON-RPC methods the test made fail. Records each
 * method called.
 */
export class FakeSolanaRpc {
  balance = 5_000_000_000;
  stakeAccounts: StakeAccountSpec[] = [];
  tokenAccounts: TokenAccountSpec[] = [];
  /** Vote accounts the node knows. */
  validators: string[] = [];
  readonly calls: string[] = [];
  /** Signed transactions sent to the node, as `sendTransaction` received them. */
  readonly broadcasts: string[] = [];
  /** What `sendTransaction` returns: the transaction's first signature, base58. */
  broadcastSignature = "";
  private readonly failing = new Map<string, string>();

  constructor(private readonly owner: string) {}

  /** Answers `method` with a JSON-RPC error carrying `message`. */
  fail(method: string, message: string): void {
    this.failing.set(method, message);
  }

  reset(): void {
    this.balance = 5_000_000_000;
    this.stakeAccounts = [];
    this.tokenAccounts = [];
    this.validators = [];
    this.calls.length = 0;
    this.broadcasts.length = 0;
    this.failing.clear();
  }

  get routes(): Route[] {
    return [
      {
        method: "POST",
        match: /^\/(\?.*)?$/,
        response: null,
        onRequest: async request => {
          const body = (await request.json()) as RpcCall | RpcCall[];
          return Response.json(
            Array.isArray(body) ? body.map(c => this.answer(c)) : this.answer(body),
          );
        },
      },
      { method: "GET", match: "/validator-details", response: [] },
      { method: "GET", match: "/validators_summary", response: [] },
      {
        method: "GET",
        match: /\/v1\/networks/,
        response: [{ id: "solana", token_list_hash: "mock-sync-hash" }],
      },
      {
        method: "GET",
        match: /\/v1\/currencies/,
        response: [{ id: "solana" }],
        headers: { "X-Ledger-Commit": "mock-sync-hash" },
      },
    ];
  }

  private answer({ id, method, params = [] }: RpcCall) {
    this.calls.push(method);
    const message = this.failing.get(method);
    if (message !== undefined) return { jsonrpc: "2.0", id, error: { code: -32000, message } };
    return { jsonrpc: "2.0", id, result: this.result(method, params) };
  }

  private result(method: string, params: unknown[]): unknown {
    const context = { context: { slot: 1, apiVersion: "2.0.0" } };
    switch (method) {
      case "getBalance":
        return { ...context, value: this.balance };
      case "getProgramAccountsV2":
        return {
          accounts: this.stakeAccounts.map(spec => parsedStakeAccount(this.owner, spec)),
          paginationKey: null,
        };
      case "getAccountInfo":
        return { ...context, value: this.accountInfo(String(params[0])) };
      case "getEpochInfo":
        return {
          epoch: SOLANA_EPOCH,
          slotIndex: 0,
          slotsInEpoch: 432_000,
          absoluteSlot: 1,
          blockHeight: 1,
        };
      case "getTokenAccountsByOwner":
        return {
          ...context,
          value: this.tokenAccounts.map(spec => parsedTokenAccount(this.owner, spec)),
        };
      case "getSignaturesForAddress":
        return [];
      case "getLatestBlockhash":
        return {
          ...context,
          value: {
            blockhash: "GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi",
            lastValidBlockHeight: 10,
          },
        };
      case "getMinimumBalanceForRentExemption":
        return STAKE_RENT;
      case "getStakeMinimumDelegation":
        return { ...context, value: 1_000_000_000 };
      case "getFeeForMessage":
        return { ...context, value: 5000 };
      case "getRecentPrioritizationFees":
        return [];
      case "simulateTransaction":
        return {
          ...context,
          value: { err: null, logs: [], accounts: null, unitsConsumed: 1000, returnData: null },
        };
      // Past the blockhash's last valid height, so web3 checks the signature status at once instead
      // of waiting on a WebSocket subscription this fake has no server for.
      case "getBlockHeight":
        return 11;
      case "getSignatureStatuses":
        return {
          ...context,
          value: [{ slot: 1, confirmations: null, err: null, confirmationStatus: "finalized" }],
        };
      case "sendTransaction":
        this.broadcasts.push(String(params[0]));
        return this.broadcastSignature;
      default:
        return null;
    }
  }

  /** The stake history sysvar (empty, so every stake is fully active), or a known vote account. */
  private accountInfo(address: string) {
    const account = { lamports: 1, executable: false, rentEpoch: 0, space: 0 };
    if (!this.validators.includes(address)) {
      return {
        ...account,
        owner: "Sysvar1111111111111111111111111111111111111",
        data: { program: "sysvar", parsed: { type: "stakeHistory", info: [] }, space: 0 },
      };
    }
    const info = {
      authorizedVoters: [{ authorizedVoter: address, epoch: SOLANA_EPOCH }],
      authorizedWithdrawer: address,
      commission: 5,
      epochCredits: [],
      lastTimestamp: { slot: 1, timestamp: 0 },
      nodePubkey: address,
      priorVoters: [],
      rootSlot: null,
      votes: [],
    };
    return {
      ...account,
      owner: "Vote111111111111111111111111111111111111111",
      data: { program: "vote", parsed: { type: "vote", info }, space: 0 },
    };
  }
}

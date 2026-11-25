import { deflateSync } from "node:zlib";
import type {
  JWT,
  MemberCredentials,
  Trustchain,
  TrustchainSDK,
} from "@ledgerhq/ledger-key-ring-protocol/types";
import type { Route } from "./mock-server";

const ACCOUNTS_DOCUMENT_PATH = "/atomic/v1/live";
// What the backend grants an enrolled agent: OWNER without CAN_ADD_BLOCK.
const ENROLLED_AGENT_PERMISSION = "fffffffb";

// Stands in for the trustchain's encryption key, like the LKRP mock SDK.
const xor = (bytes: Uint8Array): Uint8Array => bytes.map(b => b ^ 0xff);

/** A Cloud Sync answer to a pull of the account-list document. */
export type CloudSyncReply = { status?: number; json: unknown };

/** One pull of the account-list document: the version it starts from and its trustchain. */
export type Pull = {
  version: string | null;
  path: string | null;
  id: string | null;
  authorization: string | null;
};

/** The account-list document at `version`, deflated, "encrypted" and base64-encoded. */
export function syncedDocument(data: Record<string, unknown>, version: number): CloudSyncReply {
  const payload = Buffer.from(xor(deflateSync(JSON.stringify(data)))).toString("base64");
  return {
    json: { status: "out-of-sync", version, payload, date: "2026-10-07T10:00:00Z" },
  };
}

/**
 * Ledger Sync as an agent sees it: a fake App-16 SDK for `_setTestAgentLedgerSyncSdk` that restores
 * the trustchain the test scripted, and Cloud Sync as `MockServer` routes serving the account-list
 * document the test scripted. The real Cloud Sync client pulls, decrypts and parses it.
 */
export class FakeLedgerSync {
  readonly environments: string[] = [];
  readonly restores: { trustchain: Trustchain; credentials: MemberCredentials }[] = [];
  readonly pulls: Pull[] = [];
  #restore: (requested: Trustchain) => Trustchain = restoreAsRequested;
  #authError: Error | undefined;
  #permission: string | undefined = ENROLLED_AGENT_PERMISSION;
  #reply: CloudSyncReply = { json: { status: "up-to-date" } };
  #onPull: (() => void) | undefined;

  readonly routes: Route[] = [
    {
      method: "GET",
      match: new RegExp(String.raw`^${ACCOUNTS_DOCUMENT_PATH}\?`),
      response: null,
      onRequest: request => this.#answer(request),
    },
  ];

  readonly createSdk = (environment: string): TrustchainSDK => {
    this.environments.push(environment);
    const sdk: Pick<TrustchainSDK, "restoreTrustchain" | "withAuth" | "decryptUserData"> = {
      restoreTrustchain: (trustchain, credentials) => {
        this.restores.push({ trustchain, credentials });
        return Promise.resolve().then(() => this.#restore(trustchain));
      },
      withAuth: (trustchain, _credentials, job) =>
        this.#authError ? Promise.reject(this.#authError) : job(this.#jwtFor(trustchain)),
      decryptUserData: (_trustchain, data) => Promise.resolve(xor(data)),
    };
    return sdk as TrustchainSDK;
  };

  /** Restores the requested trustchain with `patch` applied, e.g. a rotated `applicationPath`. */
  restoreAs(patch: Partial<Trustchain>): this {
    this.#restore = requested => ({ ...restoreAsRequested(requested), ...patch });
    return this;
  }

  /** Fails the restore with `error`, e.g. a `TrustchainEjected`. */
  failRestore(error: Error): this {
    this.#restore = () => {
      throw error;
    };
    return this;
  }

  /** Fails signing in to Cloud Sync with `error`. */
  failAuth(error: Error): this {
    this.#authError = error;
    return this;
  }

  /** Grants `permission` (hex) on the signed-in trustchain, `undefined` none; an enrolled agent's by default. */
  grant(permission: string | undefined): this {
    this.#permission = permission;
    return this;
  }

  /** Answers every pull with `reply`; `onPull` runs first, as if another command ran meanwhile. */
  serve(reply: CloudSyncReply, onPull?: () => void): this {
    this.#reply = reply;
    this.#onPull = onPull;
    return this;
  }

  /** Back to an up-to-date document and a trustchain restored as requested, e.g. in `beforeEach`. */
  reset(): void {
    this.environments.length = 0;
    this.restores.length = 0;
    this.pulls.length = 0;
    this.#restore = restoreAsRequested;
    this.#authError = undefined;
    this.#permission = ENROLLED_AGENT_PERMISSION;
    this.#reply = { json: { status: "up-to-date" } };
    this.#onPull = undefined;
  }

  #jwtFor({ rootId, applicationPath }: Trustchain): JWT {
    const permissions =
      this.#permission === undefined ? {} : { [rootId]: { [applicationPath]: this.#permission } };
    return { accessToken: "ledger-sync-jwt", permissions };
  }

  #answer(request: Request): Response {
    const { searchParams } = new URL(request.url);
    this.pulls.push({
      version: searchParams.get("version"),
      path: searchParams.get("path"),
      id: searchParams.get("id"),
      authorization: request.headers.get("authorization"),
    });
    this.#onPull?.();
    return Response.json(this.#reply.json, { status: this.#reply.status ?? 200 });
  }
}

function restoreAsRequested(requested: Trustchain): Trustchain {
  return { ...requested, walletSyncEncryptionKey: "00".repeat(32) };
}

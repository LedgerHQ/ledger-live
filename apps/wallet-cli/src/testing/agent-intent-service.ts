import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { crypto } from "@ledgerhq/hw-ledger-key-ring-protocol";
import {
  buildUnsignedChallengeTlv,
  createSoftwareAgentIdentity,
  hexToBytes,
  sha256Digest,
  type AgentIntentRecord,
  type SoftwareAgentIdentity,
} from "@ledgerhq/agent-intent-sdk";
import { _setTestKeychain } from "../key-ring/keychain-entry";
import { saveAgentIntentSecretKey } from "../key-ring/agent-intent-keychain";
import { saveAgentIntentKeyFile } from "../key-ring/agent-intent-key-file";
import type { AgentIntentKeyStore, SessionEntry } from "../session/session-store";
import { CHALLENGE_TLV, makeAuthRoutes, type SignedChallenge } from "./auth-routes";
import { InMemoryKeychain } from "./in-memory-keychain";
import type { Route } from "./mock-server";
import { writeSessionIn } from "./session-fixture";
import { pointStateHomeAt, stateHomeEnv, type StateHomeEnv } from "./state-home";

export const AGENT_INTENT_BFF_URL = "https://global.api.stg.ledger-test.com/agent-intent";
const INTENTS_PATH = "/agent-intent/v1/intents";

/** CAL route that knows no token: intents then show token amounts in base units. */
export const CAL_KNOWS_NO_TOKENS: Route = { method: "GET", match: /\/v1\/tokens/, response: [] };

export type AgentIntentEndpoint = "createIntent" | "listIntents" | "getIntent" | "cancelIntent";

/** One answer of the service: `json` or `text` body, 200 unless `status` says otherwise. */
export type ServiceReply = {
  status?: number;
  json?: unknown;
  text?: string;
  headers?: Record<string, string>;
};

export type ReceivedRequest = {
  endpoint: AgentIntentEndpoint;
  /** Decoded, for `getIntent` and `cancelIntent`. */
  intentId?: string;
  search: URLSearchParams;
  authorization: string | null;
  body: string;
};

/** An LKRP sign-in: which key signed the challenge, for which Trustchain, and whether it verifies. */
export type SignIn = { publicKey: string; attestation?: string; signatureValid: boolean };

function endpointOf(
  method: string,
  path: string,
): Omit<ReceivedRequest, "search" | "authorization" | "body"> | undefined {
  const rest = path.slice(INTENTS_PATH.length);
  if (rest === "") return { endpoint: method === "POST" ? "createIntent" : "listIntents" };
  const [, id, action] = rest.split("/");
  const intentId = decodeURIComponent(id ?? "");
  if (method === "GET" && action === undefined) return { endpoint: "getIntent", intentId };
  if (method === "POST" && action === "cancel") return { endpoint: "cancelIntent", intentId };
  return undefined;
}

function toResponse({ status = 200, json, text, headers }: ServiceReply): Response {
  if (text !== undefined) return new Response(text, { status, headers });
  // A 204 can't carry a body.
  if (json === undefined) return new Response(null, { status, headers });
  return Response.json(json, { status, headers });
}

function verifySignIn({ signature }: SignedChallenge): SignIn {
  const { publicKey } = signature.credential;
  const digest = sha256Digest(buildUnsignedChallengeTlv(CHALLENGE_TLV));
  return {
    publicKey,
    attestation: signature.attestation,
    signatureValid:
      signature.signature !== undefined &&
      crypto.verify(digest, hexToBytes(signature.signature), hexToBytes(publicKey)),
  };
}

/**
 * The Agent Intent service (BFF) and its Keycloak/LKRP sign-in, as `MockServer` routes. Each
 * endpoint answers what the test scripted with `reply`, and every request is recorded.
 */
export class FakeAgentIntentService {
  readonly requests: ReceivedRequest[] = [];
  readonly signIns: SignIn[] = [];
  readonly #replies = new Map<AgentIntentEndpoint, ServiceReply[]>();

  readonly routes: Route[] = [
    ...makeAuthRoutes({ onAuthenticateRequest: signed => this.signIns.push(verifySignIn(signed)) }),
    {
      match: new RegExp(String.raw`^${INTENTS_PATH}(/|\?|$)`),
      response: null,
      onRequest: request => this.#answer(request),
    },
  ];

  /** Answers `endpoint` with each reply in turn, the last one for good. */
  reply(endpoint: AgentIntentEndpoint, ...replies: ServiceReply[]): this {
    this.#replies.set(endpoint, replies);
    return this;
  }

  calls(endpoint: AgentIntentEndpoint): ReceivedRequest[] {
    return this.requests.filter(r => r.endpoint === endpoint);
  }

  /** Forgets every reply and request, e.g. in `beforeEach`. */
  reset(): void {
    this.#replies.clear();
    this.requests.length = 0;
    this.signIns.length = 0;
  }

  async #answer(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const target = endpointOf(request.method, url.pathname);
    if (!target) {
      return Response.json(
        { message: `Unknown route ${request.method} ${url.pathname}` },
        { status: 404 },
      );
    }
    this.requests.push({
      ...target,
      search: url.searchParams,
      authorization: request.headers.get("authorization"),
      body: await request.text(),
    });
    const queue = this.#replies.get(target.endpoint);
    const next = queue && queue.length > 1 ? queue.shift() : queue?.[0];
    if (!next) {
      return Response.json(
        { message: `FakeAgentIntentService: no reply scripted for ${target.endpoint}` },
        { status: 501 },
      );
    }
    return toResponse(next);
  }
}

type RecordOverrides = Omit<Partial<AgentIntentRecord>, "intent"> & {
  intent?: Record<string, unknown>;
};

/** An intent as the service returns it: by default a 0.01 ETH send, `signed`. */
export function intentRecord(
  agentPubkey: string,
  overrides: RecordOverrides = {},
): AgentIntentRecord {
  return {
    id: "0192f7a4-0000-7000-8000-000000000001",
    agentPubkey,
    status: "signed",
    createdAt: "2026-10-07T10:00:00Z",
    updatedAt: "2026-10-07T10:05:00Z",
    ...overrides,
    intent: {
      type: "send",
      network: "ethereum",
      sender: "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed",
      recipient: "0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359",
      amount: "10000000000000000",
      asset: { type: "native" },
      feeStrategy: "medium",
      ...overrides.intent,
    },
  } as AgentIntentRecord;
}

export type EnrolledProfileOptions = {
  profileId?: string;
  keyStore?: AgentIntentKeyStore;
  /** Session accounts, e.g. a sender for `send`. */
  accounts?: SessionEntry[];
  /** Fields of the stored profile to change, `undefined` to drop one (e.g. `trustchainId`). */
  profile?: Record<string, unknown>;
};

export type EnrolledProfile = {
  /** For `runCli`, with `WALLET_CLI_MOCK_PORT` added. */
  env: StateHomeEnv;
  profileId: string;
  trustchainId: string;
  agent: SoftwareAgentIdentity;
  /** Holds the agent key; installed with `_setTestKeychain` until `cleanup`. */
  keychain: InMemoryKeychain;
  sessionPath: string;
  cleanup: () => void;
};

/**
 * A state dir with an Agent Intent profile enrolled against {@link AGENT_INTENT_BFF_URL}, its agent
 * key stored where the profile says. Call it in `beforeAll` and `cleanup()` in `afterAll`.
 */
export async function makeEnrolledProfile({
  profileId = "bot",
  keyStore = "os-keychain",
  accounts = [],
  profile = {},
}: EnrolledProfileOptions = {}): Promise<EnrolledProfile> {
  const stateHome = mkdtempSync(join(tmpdir(), "wallet-cli-test-"));
  const agent = createSoftwareAgentIdentity();
  const trustchainId = "tc-1";
  const sessionPath = writeSessionIn(stateHome, {
    accounts,
    agentIntentProfiles: [
      {
        profileId,
        displayName: "Bot",
        description: "Remote agent that proposes intents for review.",
        source: "openclaw",
        environment: "staging",
        bffBaseUrl: AGENT_INTENT_BFF_URL,
        publicKey: agent.publicKey,
        keyStore,
        trustchainId,
        enrollmentExpiresAt: new Date(Date.now() + 60_000).toISOString(),
        createdAt: new Date().toISOString(),
        ...profile,
      },
    ],
  });

  const keychain = new InMemoryKeychain();
  const previousKeychain = _setTestKeychain(keychain.open);
  // Key locations derive from the state dir.
  const restoreStateHome = pointStateHomeAt(stateHome);
  try {
    if (keyStore === "plaintext-file") saveAgentIntentKeyFile(profileId, agent.exportSecretKey());
    else await saveAgentIntentSecretKey(profileId, agent.exportSecretKey());
  } finally {
    restoreStateHome();
  }

  return {
    env: stateHomeEnv(stateHome),
    profileId,
    trustchainId,
    agent,
    keychain,
    sessionPath,
    cleanup: () => {
      _setTestKeychain(previousKeychain);
      rmSync(stateHome, { recursive: true, force: true });
    },
  };
}

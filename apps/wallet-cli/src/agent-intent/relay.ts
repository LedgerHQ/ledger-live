import {
  createAgentEnrollmentChannelHost,
  AGENT_KEYCLOAK_ENVIRONMENTS,
  type AgentEnrollmentChannelCompletion,
  type AgentEnrollmentChannelHost,
  type AgentEnrollmentChannelRequest,
  type AgentIntentEnvironment,
  type AgentKeycloakConfig,
} from "@ledgerhq/agent-intent-sdk";
import { AGENT_INTENT_TRUSTCHAIN_URLS } from "../key-ring/constants";
import { hasUrlCredentials } from "./profile-format";

const DURATION_RE = /^([1-9]\d*)([smhd])$/;
const DURATION_UNITS_MS = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 } as const;
const MAX_DURATION_MS = 30 * DURATION_UNITS_MS.d;

function isDurationUnit(value: string): value is keyof typeof DURATION_UNITS_MS {
  return value in DURATION_UNITS_MS;
}

/** Parses `--expires-in` (e.g. 45s, 30m, 2h, 1d) into milliseconds. Rejects `0` (an already-expired
 * link) and anything past 30 days (an unreasonable validity window, and large enough values overflow
 * `Date`/`toISOString()` with a cryptic `RangeError`). */
export function parseDurationMs(value: string): number {
  const match = DURATION_RE.exec(value);
  const unit = match?.[2];
  if (!match || !unit || !isDurationUnit(unit)) {
    throw new Error(`--expires-in "${value}" is invalid; use e.g. 45s, 30m, 2h, or 1d.`);
  }
  const ms = Number(match[1]) * DURATION_UNITS_MS[unit];
  if (ms > MAX_DURATION_MS) {
    throw new Error(`--expires-in "${value}" is too long; the maximum is 30d.`);
  }
  return ms;
}

export function assertServiceUrl(value: string, flagName: string): void {
  if (!/^https?:$/.test(new URL(value).protocol)) {
    throw new Error(`--${flagName} must be an http(s) URL.`);
  }
  if (hasUrlCredentials(value)) {
    throw new Error(
      `--${flagName} must not contain URL credentials (user:pass@) — they would be persisted or ` +
        "echoed back verbatim.",
    );
  }
}

/** Relay timers default to 15 min; stretched so only the signed expiry bounds the wait. */
export function createRelayHost(
  environment: AgentIntentEnvironment,
  expiresInMs: number,
): AgentEnrollmentChannelHost {
  return createAgentEnrollmentChannelHost({
    environment,
    relayBaseUrl: AGENT_INTENT_TRUSTCHAIN_URLS[environment],
    timeouts: { candidateTimeoutMs: expiresInMs, completionTimeoutMs: expiresInMs },
  });
}

export function keycloakOverride(
  environment: AgentIntentEnvironment,
  keycloakBaseUrl: string | undefined,
): { keycloak?: AgentKeycloakConfig } {
  return keycloakBaseUrl === undefined
    ? {}
    : { keycloak: { ...AGENT_KEYCLOAK_ENVIRONMENTS[environment], baseUrl: keycloakBaseUrl } };
}

/**
 * Waits for the relayed completion; SIGINT/SIGTERM close the relay socket and abort the wait.
 * Resolves with the completion once `persist` succeeded, even if only the acknowledgement back to
 * the frontend failed afterwards or a signal arrived while `persist` was in flight.
 */
export function waitForRelayCompletion<Request extends AgentEnrollmentChannelRequest>(
  host: AgentEnrollmentChannelHost,
  input: {
    request: Request;
    authenticate: (completion: AgentEnrollmentChannelCompletion<Request>) => Promise<void>;
    persist: (completion: AgentEnrollmentChannelCompletion<Request>) => Promise<void>;
  },
  interruptedMessage: string,
): Promise<AgentEnrollmentChannelCompletion<Request>> {
  let persisted: AgentEnrollmentChannelCompletion<Request> | undefined;
  let persisting: Promise<void> | undefined;
  let rejectInterrupted!: (reason: Error) => void;
  const interrupted = new Promise<never>((_, reject) => {
    rejectInterrupted = reject;
  });
  const onSignal = () => {
    host.close();
    rejectInterrupted(new Error(interruptedMessage));
  };
  process.once("SIGINT", onSignal);
  process.once("SIGTERM", onSignal);
  const completion = Promise.resolve().then(() =>
    host.waitForCompletion({
      ...input,
      persist: candidate => {
        persisting = input.persist(candidate).then(() => {
          persisted = candidate;
        });
        return persisting;
      },
    }),
  );
  return Promise.race([completion, interrupted])
    .catch(e =>
      Promise.resolve(persisting?.catch(() => undefined)).then(() => {
        if (persisted) return persisted;
        throw e;
      }),
    )
    .finally(() => {
      process.off("SIGINT", onSignal);
      process.off("SIGTERM", onSignal);
    });
}

import { describe, expect, it } from "bun:test";
import {
  AgentIntentHttpError,
  AgentIntentSdkError,
  createAgentIntentClient,
  createSoftwareAgentIdentity,
  staticAccessTokenProvider,
  type SendIntent,
} from "@ledgerhq/agent-intent-sdk";
import {
  describeAgentIntentError,
  isAcceptedWithoutReviewLink,
  redactServiceText,
} from "./service-errors";

const INTENT: SendIntent = {
  type: "send",
  network: "ethereum",
  sender: "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed",
  recipient: "0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359",
  amount: "1",
  asset: { type: "native" },
  feeStrategy: "medium",
};

function fakeFetch(response: () => Response): typeof fetch {
  return (async () => response()) as unknown as typeof fetch;
}

/** Runs a real SDK client over a fake transport and returns what it throws. */
async function realSdkError(options: {
  fetch?: typeof fetch;
  authFetch?: typeof fetch;
  staticToken?: boolean;
}): Promise<unknown> {
  const client = createAgentIntentClient({
    bffBaseUrl: "https://bff.example.com/agent-intent",
    identity: createSoftwareAgentIdentity(),
    trustchainId: "tc-1",
    environment: "staging",
    ...(options.staticToken ? { tokenProvider: staticAccessTokenProvider("t") } : {}),
    ...(options.fetch ? { fetch: options.fetch } : {}),
    ...(options.authFetch ? { authFetch: options.authFetch } : {}),
  });
  return client.createSendIntent(INTENT).then(
    () => {
      throw new Error("expected the SDK to throw");
    },
    (e: unknown) => e,
  );
}

// These pin the SDK errors recognized by name and message: if an SDK upgrade renames or rewords
// them, these fail instead of the "intent was accepted" handling silently vanishing.
describe("SDK errors, as the real SDK throws them", () => {
  it("recognizes the unreadable-deeplink error the SDK raises after the service accepted the intent", async () => {
    const e = await realSdkError({
      staticToken: true,
      fetch: fakeFetch(() => new Response("not a url", { status: 200 })),
    });

    expect(isAcceptedWithoutReviewLink(e)).toBe(true);
  });

  it("does not mistake a service rejection for an accepted intent", async () => {
    const e = await realSdkError({
      staticToken: true,
      fetch: fakeFetch(() => new Response("nope", { status: 500 })),
    });

    expect(isAcceptedWithoutReviewLink(e)).toBe(false);
  });

  it("recognizes the SDK's authentication failure", async () => {
    const e = await realSdkError({
      authFetch: fakeFetch(() => new Response("down", { status: 500 })),
    });

    expect(describeAgentIntentError(e, "bot").message).toMatch(
      /Could not authenticate profile "bot"/,
    );
  });

  it("maps a real SDK HTTP error carrying a service error type", async () => {
    const e = await realSdkError({
      staticToken: true,
      fetch: fakeFetch(() =>
        Response.json(
          {
            message: "The intent issuer does not match the authenticated agent.",
            type: "pubkey_mismatch",
          },
          { status: 403 },
        ),
      ),
    });

    expect(describeAgentIntentError(e, "bot").message).toMatch(/issuer does not match.*Re-enroll/s);
  });
});

describe("redactServiceText", () => {
  it("strips URL credentials, bearer tokens and long token-like runs", () => {
    const text =
      "failed for https://user:secret@bff.example.com/v1 with Bearer abc.def.ghi and " +
      `token ${"x".repeat(100)}`;

    const out = redactServiceText(text);

    expect(out).not.toContain("secret");
    expect(out).not.toContain("abc.def.ghi");
    expect(out).not.toContain("x".repeat(100));
    expect(out).toContain("https://bff.example.com/v1");
    expect(out).toContain("Bearer [redacted]");
  });

  it("masks a key-sized hex run but keeps EVM addresses readable", () => {
    const secretKey = "ab".repeat(32);
    const address = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed";

    const out = redactServiceText(`echo ${secretKey} for ${address} and 0x${secretKey}`);

    expect(out).not.toContain(secretKey);
    expect(out).toContain(address);
  });

  it("collapses whitespace and truncates very long bodies", () => {
    const out = redactServiceText(`<html>\n\n${"word ".repeat(200)}</html>`);

    expect(out).not.toContain("\n");
    expect(out.length).toBeLessThanOrEqual(301);
    expect(out.endsWith("…")).toBe(true);
  });
});

function http(status: number, type?: string, message = "service says no") {
  return new AgentIntentHttpError(message, status, type);
}

describe("describeAgentIntentError", () => {
  it("explains an issuer mismatch and points at re-enrolling", () => {
    const err = describeAgentIntentError(
      http(403, "pubkey_mismatch", "The intent issuer does not match the authenticated agent."),
      "bot",
    );

    expect(err.message).toMatch(/issuer does not match the authenticated agent/);
    expect(err.message).toMatch(/profile "bot"/);
    expect(err.message).toMatch(/Re-enroll/);
  });

  it.each(["not_a_member", "ambiguous_trustchain", "unexpected_caller", "wrong_client_type"])(
    "treats %s as a revoked or inactive enrollment",
    type => {
      expect(describeAgentIntentError(http(403, type), "bot").message).toMatch(
        /not an active agent.*Re-enroll/s,
      );
    },
  );

  it.each(["token_expired", "token_invalid"])("reports %s as an authentication failure", type => {
    expect(describeAgentIntentError(http(401, type), "bot").message).toMatch(
      /Authentication with the Agent Intent service failed/,
    );
  });

  it.each(["signature_invalid", "signature_malformed", "malformed_intent"])(
    "reports %s as a format disagreement not worth retrying",
    type => {
      expect(describeAgentIntentError(http(400, type), "bot").message).toMatch(
        /rejected the intent as invalid.*won't help/s,
      );
    },
  );

  it("says a reused nonce is safe to retry", () => {
    expect(describeAgentIntentError(http(409, "nonce_reused"), "bot").message).toMatch(
      /Re-run the command/,
    );
  });

  it("reports an unknown profile (404)", () => {
    expect(describeAgentIntentError(http(404), "bot").message).toMatch(
      /doesn't know profile "bot"/,
    );
  });

  it("never claims a 5xx means nothing was created, since the service may have saved it", () => {
    const message = describeAgentIntentError(http(503), "bot").message;

    expect(message).toMatch(/failed \(HTTP 503.*may still have been created.*before re-running/s);
    expect(message).not.toMatch(/No intent was created/);
  });

  it("redacts credentials from a raw service body", () => {
    const err = describeAgentIntentError(
      http(418, undefined, "proxy error at https://admin:hunter2@internal.example.com"),
      "bot",
    );

    expect(err.message).toContain("HTTP 418");
    expect(err.message).not.toContain("hunter2");
  });

  it("reports an SDK authentication failure with the failing leg", () => {
    const err = describeAgentIntentError(
      new AgentIntentSdkError(
        "oidc-token authentication request failed with HTTP 400: invalid_grant",
      ),
      "bot",
    );

    expect(err.message).toMatch(/Could not authenticate profile "bot".*oidc-token/s);
  });

  it("treats anything else as a connectivity problem that may hide a success", () => {
    const err = describeAgentIntentError(
      new TypeError("fetch failed: https://u:p@bff.example.com"),
      "bot",
    );

    expect(err.message).toMatch(/Could not reach the Agent Intent service/);
    expect(err.message).toMatch(/before re-running/);
    expect(err.message).not.toContain("u:p@");
  });

  it("never carries the original error as cause", () => {
    expect(describeAgentIntentError(http(500), "bot").cause).toBeUndefined();
  });
});

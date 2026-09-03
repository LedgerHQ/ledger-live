import { http, HttpResponse, passthrough, delay } from "msw";
import { createCardMockState } from "./state";

const state = createCardMockState();

const SLOW_MS = 5_000;

const MOCK_TOKEN_PREFIX = "at_mock_";

function usesMockToken(request: Request): boolean {
  return request.headers.get("authorization")?.includes(MOCK_TOKEN_PREFIX) ?? false;
}

const MOCK_USER = {
  id: "6f1c9a52-3d4e-4b7a-9c81-2f0d5e7a1b34",
  verificationState: "VERIFIED",
};

const MOCK_CARD_STATUS = {
  id: "000000000050277836",
  holderName: "JOHN DOE",
  expiryDate: "2028/01",
  panLast4: "1234",
  status: "ACTIVE",
  type: "VIRTUAL",
  orderedAt: "2023-03-27T17:07:12.662Z",
};

function rotatedSession(serial: number) {
  return HttpResponse.json({
    access_token: `${MOCK_TOKEN_PREFIX}${serial}`,
    refresh_token: `rt_mock_${serial}`,
    expires_in: 3600,
  });
}

const OAUTH_ERROR_BODY = {
  error: "invalid_grant",
  error_description: "The refresh token is invalid, expired or revoked",
};

async function answerTokenRequest(id: string, serial: number) {
  switch (id) {
    case "200":
      return rotatedSession(serial);

    case "200-slow":
      await delay(SLOW_MS);
      return rotatedSession(serial);

    case "200-bad-body":
      return HttpResponse.json({ access_token: `${MOCK_TOKEN_PREFIX}${serial}`, expires_in: 3600 });

    case "400":
      return HttpResponse.json(OAUTH_ERROR_BODY, { status: 400 });

    case "422":
      return HttpResponse.json({ message: "x field is not allowed" }, { status: 422 });

    case "498":
      return HttpResponse.json({ message: "Invalid client key" }, { status: 498 });

    case "499":
      return HttpResponse.json({ message: "Missing client key" }, { status: 499 });

    case "500":
      return HttpResponse.json({ message: "Internal server error" }, { status: 500 });

    case "network-error":
      return HttpResponse.error();

    default:
      return passthrough();
  }
}

const handlers = [
  http.post("*/v1/auth/oauth2/token", async ({ request }) => {
    const body = (await request
      .clone()
      .json()
      .catch(() => ({}))) as { grant_type?: string };

    if (body.grant_type !== "refresh_token") {
      return passthrough();
    }

    if (state.tokenResponse === "pass") {
      return passthrough();
    }

    state.refreshCount += 1;
    // eslint-disable-next-line no-console
    console.log(`[card-msw] renewal #${state.refreshCount} answers ${state.tokenResponse}`);

    return answerTokenRequest(state.tokenResponse, state.refreshCount);
  }),

  http.get("*/v1/user", ({ request }) => {
    if (state.userUnauthorizedOnce) {
      state.userUnauthorizedOnce = false;
      // eslint-disable-next-line no-console
      console.log("[card-msw] answering one /v1/user with 401");
      return HttpResponse.json({ message: "unauthorized" }, { status: 401 });
    }

    if (!usesMockToken(request)) {
      return passthrough();
    }

    // eslint-disable-next-line no-console
    console.log("[card-msw] answering /v1/user from the mock");
    return HttpResponse.json(MOCK_USER);
  }),

  http.get("*/v1/card/status", ({ request }) => {
    if (!usesMockToken(request)) {
      return passthrough();
    }
    return HttpResponse.json(MOCK_CARD_STATUS);
  }),
];

export default handlers;

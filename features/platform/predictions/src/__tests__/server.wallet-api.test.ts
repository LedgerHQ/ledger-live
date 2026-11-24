import { WalletAPIServer } from "@ledgerhq/wallet-api-server";
import {
  PLACE_ORDER_SIGNED_AT_MS,
  PLACE_ORDER_TYPED_DATA,
} from "../__fixtures__/placeOrderTypedData";
import type { PredictionsBindingAnswer } from "../binding";
import { PredictionsBindingSignerMismatch, PredictionsOrderSignerMismatch } from "../errors";
import type { PredictionsOrderAnswer } from "../order";
import type { PredictionsTypedData } from "../typedData";
import { handlers, type PredictionsUiHooks } from "../server";

type RpcErrorAnswer = { error: { code: number; data?: unknown } };

// Through the real Wallet API server, unlike server.test.ts: the JSON-RPC answer the live app gets.
function setup() {
  const uiHooks: PredictionsUiHooks = {
    "sheet.open": jest.fn(),
    "sheet.close": jest.fn(),
    "app.close": jest.fn(),
    "intro.isSeen": jest.fn(() => false),
    "intro.markSeen": jest.fn(),
    "binding.sign": jest.fn<Promise<PredictionsBindingAnswer>, [string]>(),
    "binding.reportSetup": jest.fn(),
    "order.sign": jest.fn<Promise<PredictionsOrderAnswer>, [string, PredictionsTypedData]>(),
    "order.report": jest.fn(),
  };
  const predictionsHandlers = handlers({ uiHooks });
  const answers: string[] = [];
  const transport = {
    onMessage: undefined as ((message: string) => void) | undefined,
    send: (message: string) => answers.push(message),
  };
  const config = {
    appId: "predictions",
    userId: "user",
    tracking: false,
    wallet: { name: "test-wallet", version: "1.0.0" },
  } as unknown as ConstructorParameters<typeof WalletAPIServer>[1];
  new WalletAPIServer(transport, config, undefined, predictionsHandlers).setPermissions({
    methodIds: Object.keys(predictionsHandlers),
  });

  const call = async (method: string, params: unknown): Promise<RpcErrorAnswer> => {
    transport.onMessage?.(JSON.stringify({ jsonrpc: "2.0", id: "1", method, params }));
    await new Promise(setImmediate);
    return JSON.parse(answers[0]) as RpcErrorAnswer;
  };
  const onboard = (params: unknown) => call("custom.predictions.onboard", params);
  const bindAccount = (params: unknown) => call("custom.predictions.bindAccount", params);
  const signOrder = (params: unknown) => call("custom.predictions.signOrder", params);
  return { uiHooks, onboard, bindAccount, signOrder };
}

describe("custom.predictions.onboard through the Wallet API server", () => {
  it("answers invalid params with INVALID_PARAMS, without opening a sheet", async () => {
    const { uiHooks, onboard } = setup();

    const answer = await onboard({ consnet: { disclosureVersion: "1" } });

    expect(answer.error.code).toBe(-32602);
    expect(uiHooks["sheet.open"]).not.toHaveBeenCalled();
  });

  it("keeps UnsupportedOnboardingVersion in the answer, without opening a sheet", async () => {
    const { uiHooks, onboard } = setup();

    const answer = await onboard({ terms: { termsVersion: "2", disclaimerVersion: "1" } });

    expect(answer.error.data).toMatchObject({ data: { name: "UnsupportedOnboardingVersion" } });
    expect(uiHooks["sheet.open"]).not.toHaveBeenCalled();
  });
});

describe("custom.predictions.bindAccount through the Wallet API server", () => {
  it("answers invalid params with INVALID_PARAMS, without showing the prompt", async () => {
    const { uiHooks, bindAccount } = setup();

    const answer = await bindAccount({ accountId: "" });

    expect(answer.error.code).toBe(-32602);
    expect(uiHooks["binding.sign"]).not.toHaveBeenCalled();
  });

  it.each([
    Object.assign(new Error("User refused"), { name: "UserRefusedOnDevice" }),
    new PredictionsBindingSignerMismatch("Signed by someone else"),
  ])("keeps the name of a failed binding in the answer (%s)", async error => {
    const { uiHooks, bindAccount } = setup();
    jest.mocked(uiHooks["binding.sign"]).mockRejectedValueOnce(error);

    const answer = await bindAccount({ accountId: "wallet-account-id" });

    expect(answer.error.data).toMatchObject({ data: { name: error.name } });
  });
});

describe("custom.predictions.signOrder through the Wallet API server", () => {
  beforeEach(() => jest.spyOn(Date, "now").mockReturnValue(PLACE_ORDER_SIGNED_AT_MS));
  afterEach(() => jest.restoreAllMocks());

  it("answers typed data that isn't a place order with INVALID_PARAMS, without showing the prompt", async () => {
    const { uiHooks, signOrder } = setup();

    const answer = await signOrder({
      accountId: "wallet-account-id",
      typedData: JSON.stringify({
        ...PLACE_ORDER_TYPED_DATA,
        domain: { ...PLACE_ORDER_TYPED_DATA.domain, name: "Permit2" },
      }),
    });

    expect(answer.error.code).toBe(-32602);
    expect(uiHooks["order.sign"]).not.toHaveBeenCalled();
  });

  it.each([
    ["an amount that isn't a whole number", { amount: "1.5" }],
    ["a slippage that isn't a number", { slippage: "abc" }],
  ])("answers %s with INVALID_PARAMS, without showing the prompt", async (_case, message) => {
    const { uiHooks, signOrder } = setup();

    const answer = await signOrder({
      accountId: "wallet-account-id",
      typedData: JSON.stringify({
        ...PLACE_ORDER_TYPED_DATA,
        message: { ...PLACE_ORDER_TYPED_DATA.message, ...message },
      }),
    });

    expect(answer.error.code).toBe(-32602);
    expect(uiHooks["order.sign"]).not.toHaveBeenCalled();
  });

  it.each([
    ["has expired", PLACE_ORDER_SIGNED_AT_MS / 1000 - 60],
    ["expires more than 300 s ahead", PLACE_ORDER_SIGNED_AT_MS / 1000 + 301],
  ])(
    "answers an order that %s with INVALID_PARAMS, without showing the prompt",
    async (_case, expiration) => {
      const { uiHooks, signOrder } = setup();

      const answer = await signOrder({
        accountId: "wallet-account-id",
        typedData: JSON.stringify({
          ...PLACE_ORDER_TYPED_DATA,
          message: { ...PLACE_ORDER_TYPED_DATA.message, expiration: String(expiration) },
        }),
      });

      expect(answer.error.code).toBe(-32602);
      expect(uiHooks["order.sign"]).not.toHaveBeenCalled();
    },
  );

  it.each([
    Object.assign(new Error("User refused"), { name: "UserRefusedOnDevice" }),
    new PredictionsOrderSignerMismatch("Signed by someone else"),
  ])("keeps the name of a failed order signature in the answer (%s)", async error => {
    const { uiHooks, signOrder } = setup();
    jest.mocked(uiHooks["order.sign"]).mockRejectedValueOnce(error);

    const answer = await signOrder({
      accountId: "wallet-account-id",
      typedData: JSON.stringify(PLACE_ORDER_TYPED_DATA),
    });

    expect(answer.error.data).toMatchObject({ data: { name: error.name } });
  });
});

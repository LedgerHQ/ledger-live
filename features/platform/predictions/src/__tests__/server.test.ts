import {
  PLACE_ORDER_SIGNED_AT_MS,
  PLACE_ORDER_TYPED_DATA,
} from "../__fixtures__/placeOrderTypedData";
import type { PredictionsBindingAnswer } from "../binding";
import type {
  PredictionsOrderAction,
  PredictionsOrderAnswer,
  PredictionsOrderOutcome,
} from "../order";
import type { PredictionsTypedData } from "../typedData";
import { handlers, type PredictionsSheet, type PredictionsUiHooks } from "../server";

jest.mock("@ledgerhq/wallet-api-server", () => ({
  customWrapper: jest.fn(handler => handler),
}));

type MockedHandlers = Record<string, (params?: unknown) => Promise<unknown>>;

const TERMS_VERSIONS = { termsVersion: "1", disclaimerVersion: "1" };
const CONSENT_VERSION = { disclosureVersion: "1" };
const BINDING_ANSWER: PredictionsBindingAnswer = {
  typedData: {
    domain: { name: "Ledger Predictions", version: "1", chainId: 137 },
    types: { EIP712Domain: [], ConfirmAccountOwnership: [{ name: "account", type: "address" }] },
    primaryType: "ConfirmAccountOwnership",
    message: { account: "0x9858EfFD232B4033E47d90003D41EC34EcaEda94" },
  },
  signature: "0x1234",
};

function setup({ hasSeenIntro = false } = {}) {
  let openSheet: { sheet: PredictionsSheet; onCancel: () => void } | null = null;
  const uiHooks = {
    "sheet.open": jest.fn<void, Parameters<PredictionsUiHooks["sheet.open"]>>((sheet, onCancel) => {
      openSheet = { sheet, onCancel };
    }),
    "sheet.close": jest.fn(),
    "app.close": jest.fn(),
    "intro.isSeen": jest.fn(() => hasSeenIntro),
    "intro.markSeen": jest.fn(),
    "binding.sign": jest.fn<Promise<PredictionsBindingAnswer>, [string]>(() =>
      Promise.resolve(BINDING_ANSWER),
    ),
    "binding.reportSetup": jest.fn(),
    "order.sign": jest.fn<Promise<PredictionsOrderAnswer>, [string, PredictionsTypedData]>(() =>
      Promise.resolve({ signature: "0x5678", orderId: "7" }),
    ),
    "order.report": jest.fn<Promise<PredictionsOrderAction>, [string, PredictionsOrderOutcome]>(
      () => Promise.resolve("retry"),
    ),
  };
  const serverHandlers = handlers({ uiHooks }) as unknown as MockedHandlers;
  const onboard = (params?: unknown) => serverHandlers["custom.predictions.onboard"](params);
  const bindAccount = (params?: unknown) =>
    serverHandlers["custom.predictions.bindAccount"](params);
  const reportSetup = (params?: unknown) =>
    serverHandlers["custom.predictions.reportSetup"](params);
  const signOrder = (params?: unknown) => serverHandlers["custom.predictions.signOrder"](params);
  const reportOrder = (params?: unknown) =>
    serverHandlers["custom.predictions.reportOrder"](params);
  const getOpenSheet = () => {
    if (openSheet === null) throw new Error("No sheet is open");
    return openSheet;
  };
  const acceptAllSteps = () => {
    const { sheet } = getOpenSheet();
    sheet.steps.forEach(step => sheet.onStepAccept(step));
    sheet.onComplete();
  };
  return {
    uiHooks,
    serverHandlers,
    onboard,
    bindAccount,
    reportSetup,
    signOrder,
    reportOrder,
    getOpenSheet,
    acceptAllSteps,
  };
}

describe("Predictions Wallet API handlers", () => {
  describe("custom.predictions.onboard", () => {
    it("opens one sheet with the requested steps in order and resolves the accepted versions", async () => {
      const { onboard, uiHooks, getOpenSheet, acceptAllSteps } = setup();

      const answer = onboard({ consent: CONSENT_VERSION, terms: TERMS_VERSIONS, intro: {} });

      expect(uiHooks["sheet.open"]).toHaveBeenCalledTimes(1);
      expect(getOpenSheet().sheet.steps).toEqual([
        { type: "intro" },
        { type: "terms", versions: TERMS_VERSIONS },
        { type: "consent", version: CONSENT_VERSION },
      ]);
      acceptAllSteps();

      await expect(answer).resolves.toEqual({
        isCompleted: true,
        terms: TERMS_VERSIONS,
        consent: CONSENT_VERSION,
      });
    });

    it("shows only the steps the live app asks for", async () => {
      const { onboard, getOpenSheet, acceptAllSteps } = setup();

      const answer = onboard({ terms: TERMS_VERSIONS });

      expect(getOpenSheet().sheet.steps).toEqual([{ type: "terms", versions: TERMS_VERSIONS }]);
      acceptAllSteps();

      await expect(answer).resolves.toEqual({ isCompleted: true, terms: TERMS_VERSIONS });
    });

    it("skips the intro the user already saw", async () => {
      const { onboard, getOpenSheet } = setup({ hasSeenIntro: true });

      onboard({ intro: {}, consent: CONSENT_VERSION });

      expect(getOpenSheet().sheet.steps).toEqual([{ type: "consent", version: CONSENT_VERSION }]);
    });

    it.each([{}, { intro: {} }])(
      "resolves without opening a sheet when there is nothing to show (%p)",
      async params => {
        const { onboard, uiHooks } = setup({ hasSeenIntro: true });

        await expect(onboard(params)).resolves.toEqual({ isCompleted: true });
        expect(uiHooks["sheet.open"]).not.toHaveBeenCalled();
      },
    );

    it("marks the intro seen as soon as the user accepts it", () => {
      const { onboard, uiHooks, getOpenSheet } = setup();

      onboard({ intro: {}, terms: TERMS_VERSIONS });
      const { sheet } = getOpenSheet();
      sheet.onStepAccept(sheet.steps[0]);

      expect(uiHooks["intro.markSeen"]).toHaveBeenCalledTimes(1);
    });

    it("waits for the last step before answering", async () => {
      const { onboard, getOpenSheet } = setup();

      let isAnswered = false;
      void onboard({ terms: TERMS_VERSIONS, consent: CONSENT_VERSION }).then(() => {
        isAnswered = true;
      });
      const { sheet } = getOpenSheet();
      sheet.onStepAccept(sheet.steps[0]);
      await new Promise(setImmediate);

      expect(isAnswered).toBe(false);

      sheet.onStepAccept(sheet.steps[1]);
      sheet.onComplete();
      await new Promise(setImmediate);

      expect(isAnswered).toBe(true);
    });

    it("answers an uncompleted onboarding when the user closes the sheet first", async () => {
      const { onboard, uiHooks, getOpenSheet } = setup();

      const answer = onboard({ intro: {}, terms: TERMS_VERSIONS });
      getOpenSheet().onCancel();

      await expect(answer).resolves.toEqual({ isCompleted: false });
      expect(uiHooks["intro.markSeen"]).not.toHaveBeenCalled();
    });

    it("keeps what the user accepted before closing the sheet", async () => {
      const { onboard, getOpenSheet } = setup();

      const answer = onboard({ intro: {}, terms: TERMS_VERSIONS, consent: CONSENT_VERSION });
      const { sheet, onCancel } = getOpenSheet();
      sheet.onStepAccept(sheet.steps[0]);
      sheet.onStepAccept(sheet.steps[1]);
      onCancel();

      await expect(answer).resolves.toEqual({ isCompleted: false, terms: TERMS_VERSIONS });
    });

    it.each([
      undefined,
      { terms: {} },
      { terms: { termsVersion: "1" } },
      { terms: { termsVersion: "", disclaimerVersion: "1" } },
      { consent: { disclosureVersion: "" } },
      { consnet: { disclosureVersion: "1" } },
      { intro: { isSeen: true } },
    ])("rejects invalid params without opening a sheet (%p)", async params => {
      const { onboard, uiHooks } = setup();

      await expect(onboard(params)).rejects.toMatchObject({ name: "ZodError" });
      expect(uiHooks["sheet.open"]).not.toHaveBeenCalled();
    });

    it.each([
      { terms: { termsVersion: "2", disclaimerVersion: "1" } },
      { terms: { termsVersion: "1", disclaimerVersion: "2" } },
      { intro: {}, terms: TERMS_VERSIONS, consent: { disclosureVersion: "2" } },
    ])(
      "refuses versions Ledger Wallet has no text for, without opening a sheet (%p)",
      async params => {
        const { onboard, uiHooks } = setup();

        await expect(onboard(params)).rejects.toMatchObject({
          name: "UnsupportedOnboardingVersion",
        });
        expect(uiHooks["sheet.open"]).not.toHaveBeenCalled();
      },
    );
  });

  describe("custom.predictions.bindAccount", () => {
    it("signs the binding with the account and answers the message and its signature", async () => {
      const { bindAccount, uiHooks } = setup();

      await expect(bindAccount({ accountId: "wallet-account-id" })).resolves.toEqual(
        BINDING_ANSWER,
      );
      expect(uiHooks["binding.sign"]).toHaveBeenCalledWith("wallet-account-id");
    });

    it("rejects when the user declines", async () => {
      const { bindAccount, uiHooks } = setup();
      const refusal = Object.assign(new Error("declined"), { name: "UserRefusedOnDevice" });
      uiHooks["binding.sign"].mockRejectedValueOnce(refusal);

      await expect(bindAccount({ accountId: "wallet-account-id" })).rejects.toBe(refusal);
    });

    it.each([undefined, {}, { accountId: "" }, { accountId: "id", typedData: {} }])(
      "rejects invalid params without showing the prompt (%p)",
      async params => {
        const { bindAccount, uiHooks } = setup();

        await expect(bindAccount(params)).rejects.toMatchObject({ name: "ZodError" });
        expect(uiHooks["binding.sign"]).not.toHaveBeenCalled();
      },
    );
  });

  describe("custom.predictions.reportSetup", () => {
    it.each([
      { outcome: "created" },
      { outcome: "found" },
      { outcome: "failed", reason: "failed-permission" },
      { outcome: "failed", reason: "unavailable" },
    ])("shows how the setup ended in the binding prompt (%p)", async outcome => {
      const { reportSetup, uiHooks } = setup();

      await expect(reportSetup(outcome)).resolves.toEqual({});
      expect(uiHooks["binding.reportSetup"]).toHaveBeenCalledWith(outcome);
    });

    it.each([undefined, {}, { outcome: "failed" }, { outcome: "failed", reason: "lost" }])(
      "rejects an invalid outcome (%p)",
      async params => {
        const { reportSetup, uiHooks } = setup();

        await expect(reportSetup(params)).rejects.toMatchObject({ name: "ZodError" });
        expect(uiHooks["binding.reportSetup"]).not.toHaveBeenCalled();
      },
    );
  });

  describe("custom.predictions.signOrder", () => {
    beforeEach(() => jest.spyOn(Date, "now").mockReturnValue(PLACE_ORDER_SIGNED_AT_MS));
    afterEach(() => jest.restoreAllMocks());

    const imageUrl = "https://polymarket-upload.s3.us-east-2.amazonaws.com/fed.png";
    const display = { marketTitle: "Fed decision in December?", outcomeLabel: "Yes", imageUrl };
    const params = {
      accountId: "wallet-account-id",
      typedData: JSON.stringify(PLACE_ORDER_TYPED_DATA),
      display,
    };

    it("signs the order with the account, with the market to show, and answers its signature", async () => {
      const { signOrder, uiHooks } = setup();

      await expect(signOrder(params)).resolves.toEqual({ signature: "0x5678", orderId: "7" });
      expect(uiHooks["order.sign"]).toHaveBeenCalledWith(
        "wallet-account-id",
        { ...PLACE_ORDER_TYPED_DATA, domain: { ...PLACE_ORDER_TYPED_DATA.domain, chainId: 137 } },
        display,
      );
    });

    it("keeps the event of a market that is one of several", async () => {
      const { signOrder, uiHooks } = setup();
      const marketOfEvent = {
        eventTitle: "Will Anthropic's valuation hit __ by December 31?",
        marketTitle: "↑$4.0T",
        outcomeLabel: "Yes",
      };

      await signOrder({ ...params, display: marketOfEvent });

      expect(uiHooks["order.sign"]).toHaveBeenCalledWith(
        expect.any(String),
        expect.anything(),
        marketOfEvent,
      );
    });

    it.each(["yes", "no"] as const)("keeps the %s side of a binary outcome", async outcomeSide => {
      const { signOrder, uiHooks } = setup();

      await signOrder({ ...params, display: { ...display, outcomeSide } });

      expect(uiHooks["order.sign"]).toHaveBeenCalledWith(expect.any(String), expect.anything(), {
        ...display,
        outcomeSide,
      });
    });

    it("keeps a market without an image", async () => {
      const { signOrder, uiHooks } = setup();

      await signOrder({ ...params, display: { marketTitle: "Fed", outcomeLabel: "No" } });

      expect(uiHooks["order.sign"]).toHaveBeenCalledWith(expect.any(String), expect.anything(), {
        marketTitle: "Fed",
        outcomeLabel: "No",
      });
    });

    it.each([
      "http://polymarket-upload.s3.us-east-2.amazonaws.com/fed.png",
      "https://example.com/fed.png",
      "https://polymarket-upload.s3.us-east-2.amazonaws.com@example.com/fed.png",
      "https://user@polymarket-upload.s3.us-east-2.amazonaws.com/fed.png",
      "https://polymarket-upload.s3.us-east-2.amazonaws.com:8443/fed.png",
      "https://polymarket-upload.s3.us-east-2.amazonaws.com.example.com/fed.png",
      "not a url",
    ])("signs the order but drops an image Ledger Wallet doesn't load (%s)", async url => {
      const { signOrder, uiHooks } = setup();

      await signOrder({ ...params, display: { ...display, imageUrl: url } });

      expect(uiHooks["order.sign"]).toHaveBeenCalledWith(expect.any(String), expect.anything(), {
        marketTitle: display.marketTitle,
        outcomeLabel: display.outcomeLabel,
        imageUrl: undefined,
      });
    });

    it("rejects when the user declines", async () => {
      const { signOrder, uiHooks } = setup();
      const refusal = Object.assign(new Error("declined"), { name: "UserRefusedOnDevice" });
      uiHooks["order.sign"].mockRejectedValueOnce(refusal);

      await expect(signOrder(params)).rejects.toBe(refusal);
    });

    it.each([
      undefined,
      {},
      { ...params, accountId: "" },
      { accountId: "wallet-account-id" },
      { ...params, typedData: PLACE_ORDER_TYPED_DATA },
      {
        ...params,
        typedData: JSON.stringify({ ...PLACE_ORDER_TYPED_DATA, primaryType: "Withdraw" }),
      },
      { ...params, extra: true },
      { accountId: params.accountId, typedData: params.typedData },
      { ...params, display: { ...display, marketTitle: "" } },
      { ...params, display: { ...display, eventTitle: "" } },
      { ...params, display: { ...display, outcomeSide: "maybe" } },
      { ...params, display: { ...display, outcomeSide: "YES" } },
      { ...params, display: { ...display, eventTitle: "a".repeat(201) } },
      { ...params, display: { ...display, marketTitle: "a".repeat(201) } },
      { ...params, display: { ...display, outcomeLabel: "" } },
      { ...params, display: { ...display, outcomeLabel: "a".repeat(61) } },
      { ...params, display: { ...display, side: "sell" } },
    ])("rejects invalid params without showing the prompt (%p)", async invalidParams => {
      const { signOrder, uiHooks } = setup();

      await expect(signOrder(invalidParams)).rejects.toMatchObject({ name: "ZodError" });
      expect(uiHooks["order.sign"]).not.toHaveBeenCalled();
    });
  });

  describe("custom.predictions.reportOrder", () => {
    it.each([
      { outcome: "filled", shares: 3.7, price: 0.54 },
      { outcome: "filled" },
      { outcome: "not-filled" },
      { outcome: "rejected", reason: "expired-signature" },
      { outcome: "rejected", reason: "market-closed" },
      { outcome: "unconfirmed" },
    ])("shows how the order ended and answers the user's pick (%p)", async outcome => {
      const { reportOrder, uiHooks } = setup();

      await expect(reportOrder({ orderId: "7", ...outcome })).resolves.toEqual({
        action: "retry",
      });
      expect(uiHooks["order.report"]).toHaveBeenCalledWith("7", outcome);
    });

    it.each([
      undefined,
      {},
      { orderId: "7" },
      { orderId: "7", outcome: "filled", shares: 3.7 },
      { orderId: "7", outcome: "filled", shares: 0, price: 0.54 },
      { orderId: "7", outcome: "rejected" },
      { orderId: "7", outcome: "rejected", reason: "lost" },
      { orderId: "7", outcome: "not-filled", reason: "market-closed" },
      { orderId: "7", outcome: "cancelled" },
      { outcome: "not-filled" },
      { orderId: "", outcome: "not-filled" },
    ])("rejects an invalid report (%p)", async params => {
      const { reportOrder, uiHooks } = setup();

      await expect(reportOrder(params)).rejects.toMatchObject({ name: "ZodError" });
      expect(uiHooks["order.report"]).not.toHaveBeenCalled();
    });
  });

  describe("custom.predictions.close", () => {
    it("closes the sheet and the live app", async () => {
      const { serverHandlers, uiHooks } = setup();

      await expect(serverHandlers["custom.predictions.close"]({})).resolves.toEqual({});
      expect(uiHooks["sheet.close"]).toHaveBeenCalled();
      expect(uiHooks["app.close"]).toHaveBeenCalled();
    });
  });
});

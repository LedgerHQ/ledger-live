import type { PredictionsBindingAnswer } from "../binding";
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
  };
  const serverHandlers = handlers({ uiHooks }) as unknown as MockedHandlers;
  const onboard = (params?: unknown) => serverHandlers["custom.predictions.onboard"](params);
  const bindAccount = (params?: unknown) =>
    serverHandlers["custom.predictions.bindAccount"](params);
  const reportSetup = (params?: unknown) =>
    serverHandlers["custom.predictions.reportSetup"](params);
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

  describe("custom.predictions.close", () => {
    it("closes the sheet and the live app", async () => {
      const { serverHandlers, uiHooks } = setup();

      await expect(serverHandlers["custom.predictions.close"]({})).resolves.toEqual({});
      expect(uiHooks["sheet.close"]).toHaveBeenCalled();
      expect(uiHooks["app.close"]).toHaveBeenCalled();
    });
  });
});

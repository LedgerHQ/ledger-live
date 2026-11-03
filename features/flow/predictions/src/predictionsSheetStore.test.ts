import { act, renderHook } from "@testing-library/react";
import { CONSENT_STEP, INTRO_STEP, openOnboardingSheet } from "./__tests__/onboardingSheet";
import { usePredictionsSheetHooks } from "./predictionsSheetStore";
import {
  acceptPredictionsStep,
  dismissPredictionsSheet,
  showPredictionsSheet,
  usePredictionsStep,
} from "./predictionsSheetStore.internals";

function renderStep() {
  const { result } = renderHook(() => usePredictionsStep());
  return {
    isOpen: () => result.current.isOpen,
    shownStep: () => result.current.shownStep?.step ?? null,
    shownKey: () => result.current.shownStep?.key,
    acceptShownStep: () => act(() => acceptPredictionsStep(result.current.shownStep?.key ?? "")),
  };
}

const consentSheet = () => ({
  steps: [CONSENT_STEP] as const,
  onStepAccept: jest.fn(),
  onComplete: jest.fn(),
});

describe("predictionsSheetStore", () => {
  afterEach(() => {
    act(() => dismissPredictionsSheet());
  });

  it("should show nothing until a sheet is opened", () => {
    const sheet = renderStep();

    expect(sheet.isOpen()).toBe(false);
    expect(sheet.shownStep()).toBeNull();
  });

  it("should show the first step of the opened sheet", () => {
    const sheet = renderStep();

    openOnboardingSheet(INTRO_STEP, CONSENT_STEP);

    expect(sheet.isOpen()).toBe(true);
    expect(sheet.shownStep()).toBe(INTRO_STEP);
  });

  it("should move to the next step once the user accepts one, without completing", () => {
    const sheet = renderStep();
    const { onStepAccept, onComplete, onCancel } = openOnboardingSheet(INTRO_STEP, CONSENT_STEP);

    sheet.acceptShownStep();

    expect(sheet.shownStep()).toBe(CONSENT_STEP);
    expect(onStepAccept).toHaveBeenCalledWith(INTRO_STEP);
    expect(onComplete).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("should close and complete once the user accepts the last step", () => {
    const sheet = renderStep();
    const { onStepAccept, onComplete, onCancel } = openOnboardingSheet(INTRO_STEP, CONSENT_STEP);

    sheet.acceptShownStep();
    sheet.acceptShownStep();

    expect(sheet.isOpen()).toBe(false);
    expect(onStepAccept).toHaveBeenLastCalledWith(CONSENT_STEP);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("should keep showing the last step while the sheet animates closed", () => {
    const sheet = renderStep();
    openOnboardingSheet(CONSENT_STEP);

    sheet.acceptShownStep();

    expect(sheet.isOpen()).toBe(false);
    expect(sheet.shownStep()).toBe(CONSENT_STEP);
  });

  it("should ignore an accept while no sheet is open", () => {
    const sheet = renderStep();

    act(() => acceptPredictionsStep("1-0"));

    expect(sheet.isOpen()).toBe(false);
  });

  it("should ignore a late accept from a step that is no longer the open one", () => {
    const sheet = renderStep();
    openOnboardingSheet(CONSENT_STEP);
    const closingStepKey = sheet.shownKey() ?? "";
    sheet.acceptShownStep();
    const next = openOnboardingSheet(CONSENT_STEP);

    act(() => acceptPredictionsStep(closingStepKey));

    expect(sheet.isOpen()).toBe(true);
    expect(next.onStepAccept).not.toHaveBeenCalled();
    expect(next.onComplete).not.toHaveBeenCalled();
  });

  it("should replace the open sheet and cancel it, so its call doesn't hang", () => {
    const sheet = renderStep();
    const displaced = openOnboardingSheet(INTRO_STEP);

    const next = openOnboardingSheet(CONSENT_STEP);

    expect(sheet.shownStep()).toBe(CONSENT_STEP);
    expect(displaced.onCancel).toHaveBeenCalledTimes(1);
    expect(next.onCancel).not.toHaveBeenCalled();
  });

  it("should show a replacing sheet as a new step even when it starts on the same one", () => {
    const sheet = renderStep();
    openOnboardingSheet(CONSENT_STEP);
    const replacedKey = sheet.shownKey();

    openOnboardingSheet(CONSENT_STEP);

    expect(sheet.shownKey()).not.toBe(replacedKey);
  });

  it("should close the sheet and cancel it once when it's dismissed", () => {
    const sheet = renderStep();
    const { onComplete, onCancel } = openOnboardingSheet(INTRO_STEP, CONSENT_STEP);

    act(() => dismissPredictionsSheet());
    act(() => dismissPredictionsSheet());

    expect(sheet.isOpen()).toBe(false);
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("should keep a sheet the live app opens while the previous one completes", () => {
    const sheet = renderStep();
    const { onComplete, onCancel } = openOnboardingSheet(INTRO_STEP);
    onComplete.mockImplementation(() => showPredictionsSheet(consentSheet(), jest.fn()));

    sheet.acceptShownStep();

    expect(sheet.shownStep()).toBe(CONSENT_STEP);
    expect(onCancel).not.toHaveBeenCalled();
  });
});

describe("usePredictionsSheetHooks", () => {
  afterEach(() => {
    act(() => dismissPredictionsSheet());
  });

  it("should close and cancel the open sheet when the live app closes it", () => {
    const sheet = renderStep();
    const { result } = renderHook(() => usePredictionsSheetHooks());
    const onCancel = jest.fn();

    act(() => result.current["sheet.open"](consentSheet(), onCancel));
    act(() => result.current["sheet.close"]());

    expect(sheet.isOpen()).toBe(false);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("should close and cancel its own sheet when its player unmounts", () => {
    const sheet = renderStep();
    const player = renderHook(() => usePredictionsSheetHooks());
    const onCancel = jest.fn();
    act(() => player.result.current["sheet.open"](consentSheet(), onCancel));

    player.unmount();

    expect(sheet.isOpen()).toBe(false);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("should leave a sheet another player opened when its player unmounts", () => {
    const sheet = renderStep();
    const firstPlayer = renderHook(() => usePredictionsSheetHooks());
    const secondPlayer = renderHook(() => usePredictionsSheetHooks());
    const onCancel = jest.fn();
    act(() => firstPlayer.result.current["sheet.open"](consentSheet(), jest.fn()));
    act(() => secondPlayer.result.current["sheet.open"](consentSheet(), onCancel));

    firstPlayer.unmount();

    expect(sheet.isOpen()).toBe(true);
    expect(onCancel).not.toHaveBeenCalled();
  });
});

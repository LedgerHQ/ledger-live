import { renderHook } from "@testing-library/react";
import { useVerifyAddressViewModel } from "../useVerifyAddressViewModel";
import type { VerifyAddressLabels, VerifyAddressProps } from "../../../types";

const LABELS: VerifyAddressLabels = {
  introTitle: "Verify your address",
  introDescription: "To protect against address replacement attacks, verify your address.",
  verifyCta: "Verify address",
  successTitle: "Address displayed on the device's Secure Screen",
  nextStepsLabel: "Next steps",
  nextStepShare: "Share your address via your desired app",
  nextStepMatch: "Ensure the shared address matches the one on your Ledger Device.",
  gotItCta: "Got it",
};

function setup(overrides: Partial<VerifyAddressProps> = {}) {
  const props: VerifyAddressProps = {
    phase: "intro",
    labels: LABELS,
    page: "Pay",
    onVerify: jest.fn(),
    onGotIt: jest.fn(),
    onClose: jest.fn(),
    onTrackEvent: jest.fn(),
    ...overrides,
  };
  const { result } = renderHook(() => useVerifyAddressViewModel(props));
  return { props, result };
}

describe("useVerifyAddressViewModel", () => {
  it("maps the phase to open flags", () => {
    expect(setup({ phase: "hidden" }).result.current).toMatchObject({
      isIntroOpen: false,
      isSuccessOpen: false,
    });
    expect(setup({ phase: "intro" }).result.current).toMatchObject({
      isIntroOpen: true,
      isSuccessOpen: false,
    });
    expect(setup({ phase: "success" }).result.current).toMatchObject({
      isIntroOpen: false,
      isSuccessOpen: true,
    });
  });

  it("builds the two ordered next steps from the labels", () => {
    const { result } = setup();

    expect(result.current.nextSteps).toEqual([
      { index: 1, label: LABELS.nextStepShare },
      { index: 2, label: LABELS.nextStepMatch },
    ]);
  });

  it("tracks then starts the device intent on verify", () => {
    const { props, result } = setup();

    result.current.onVerify();

    expect(props.onTrackEvent).toHaveBeenCalledWith("button_clicked", {
      button: "verify address",
      buttonLocation: "verify address",
      page: "Pay",
    });
    expect(props.onVerify).toHaveBeenCalledTimes(1);
  });

  it("tracks then closes on got it", () => {
    const { props, result } = setup();

    result.current.onGotIt();

    expect(props.onTrackEvent).toHaveBeenCalledWith("button_clicked", {
      button: "got it",
      buttonLocation: "verify address",
      page: "Pay",
    });
    expect(props.onGotIt).toHaveBeenCalledTimes(1);
  });

  it("does not throw when no tracker is provided", () => {
    const { props, result } = setup({ onTrackEvent: undefined });

    expect(() => result.current.onVerify()).not.toThrow();
    expect(props.onVerify).toHaveBeenCalledTimes(1);
  });
});

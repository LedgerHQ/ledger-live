import { renderHook } from "@testing-library/react";
import {
  i18nWrapper,
  REQUEST_RESOURCES,
  VERIFY_ADDRESS_COPY,
} from "../../../__tests__/i18nWrapper";
import { useVerifyAddressViewModel } from "../useVerifyAddressViewModel";
import type { VerifyAddressProps } from "../../../types";

function setup(overrides: Partial<VerifyAddressProps> = {}) {
  const props: VerifyAddressProps = {
    phase: "intro",
    page: "Pay",
    onVerify: jest.fn(),
    onGotIt: jest.fn(),
    onClose: jest.fn(),
    onTrackEvent: jest.fn(),
    ...overrides,
  };
  const { result } = renderHook(() => useVerifyAddressViewModel(props), {
    wrapper: i18nWrapper(REQUEST_RESOURCES),
  });
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

  it("builds the two ordered next steps from translations", () => {
    const { result } = setup();

    expect(result.current.nextSteps).toEqual([
      { index: 1, label: VERIFY_ADDRESS_COPY.nextStepShare },
      { index: 2, label: VERIFY_ADDRESS_COPY.nextStepMatch },
    ]);
  });

  it("tracks then starts the device intent on verify", () => {
    const { props, result } = setup();

    result.current.onVerify();

    expect(props.onTrackEvent).toHaveBeenCalledWith("button_clicked", {
      button: "verify",
      buttonLocation: "verify address",
      page: "Pay",
      flow: "request",
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
      flow: "request",
    });
    expect(props.onGotIt).toHaveBeenCalledTimes(1);
  });

  it("does not throw when no tracker is provided", () => {
    const { props, result } = setup({ onTrackEvent: undefined });

    expect(() => result.current.onVerify()).not.toThrow();
    expect(props.onVerify).toHaveBeenCalledTimes(1);
  });
});

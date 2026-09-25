import { renderHook } from "@testing-library/react";
import {
  i18nWrapper,
  REQUEST_RESOURCES,
  VERIFY_ADDRESS_COPY,
} from "../../../__tests__/i18nWrapper";
import { useVerifyAddressViewModel } from "../useVerifyAddressViewModel";
import type { VerifyAddressProps } from "../../../types";
import { trackButtonClicked } from "@features/platform-pay-analytics/testing/module-mock";

jest.mock("@features/platform-pay-analytics", () =>
  jest.requireActual("@features/platform-pay-analytics/testing/module-mock"),
);

function setup(overrides: Partial<VerifyAddressProps> = {}) {
  const props: VerifyAddressProps = {
    phase: "intro",
    page: "Pay",
    onVerify: jest.fn(),
    onGotIt: jest.fn(),
    onClose: jest.fn(),
    ...overrides,
  };
  const { result } = renderHook(() => useVerifyAddressViewModel(props), {
    wrapper: i18nWrapper(REQUEST_RESOURCES),
  });
  return { props, result };
}

describe("useVerifyAddressViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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

    expect(trackButtonClicked).toHaveBeenCalledWith({
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

    expect(trackButtonClicked).toHaveBeenCalledWith({
      button: "got it",
      buttonLocation: "verify address",
      page: "Pay",
      flow: "request",
    });
    expect(props.onGotIt).toHaveBeenCalledTimes(1);
  });
});

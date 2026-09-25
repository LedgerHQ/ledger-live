import { renderHook } from "@testing-library/react";
import { useDepositOptionsViewModel } from "../useDepositOptionsViewModel";
import type { DepositOptionsProps } from "../../../types";
import { DEPOSIT_RESOURCES, i18nWrapper } from "./i18nWrapper";
import { trackButtonClicked } from "@features/platform-pay-analytics/testing/module-mock";

jest.mock("@features/platform-pay-analytics", () =>
  jest.requireActual("@features/platform-pay-analytics/testing/module-mock"),
);

function setup(overrides: Partial<DepositOptionsProps> = {}) {
  const props: DepositOptionsProps = {
    isOpen: true,
    page: "Pay",
    onClose: jest.fn(),
    onSelect: jest.fn(),
    ...overrides,
  };
  const { result } = renderHook(() => useDepositOptionsViewModel(props), {
    wrapper: i18nWrapper(DEPOSIT_RESOURCES),
  });
  return { props, result };
}

describe("useDepositOptionsViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("builds the four options in a fixed order", () => {
    const { result } = setup();

    expect(result.current.title).toBe("Deposit stablecoin");
    expect(result.current.options.map(option => option.id)).toEqual([
      "bankTransfer",
      "swap",
      "receive",
      "buy",
    ]);
    expect(result.current.options[0]).toEqual({
      id: "bankTransfer",
      title: "Bank transfer",
      description: "From your bank account",
    });
  });

  it("tracks, selects, then closes when an option is picked", () => {
    const { props, result } = setup();

    result.current.onSelectOption("receive");

    expect(trackButtonClicked).toHaveBeenCalledWith({
      button: "receive via crypto address",
      buttonLocation: "deposit",
      page: "Pay",
    });
    expect(props.onSelect).toHaveBeenCalledWith("receive");
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("resolves its copy from the mounted i18n provider, not from props", () => {
    const { result } = renderHook(
      () =>
        useDepositOptionsViewModel({
          isOpen: true,
          page: "Pay",
          onClose: jest.fn(),
          onSelect: jest.fn(),
        }),
      {
        wrapper: i18nWrapper({
          en: { translation: { payTab: { deposit: { title: "Déposer" } } } },
        }),
      },
    );

    expect(result.current.title).toBe("Déposer");
  });
});

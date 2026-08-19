import { renderHook } from "@testing-library/react";
import { useDepositOptionsViewModel } from "../useDepositOptionsViewModel";
import type { DepositOptionsProps } from "../../../types";

const LABELS: DepositOptionsProps["labels"] = {
  title: "Deposit stablecoin",
  options: {
    bankTransfer: { title: "Bank transfer", description: "From your bank account" },
    swap: { title: "Swap", description: "From your crypto" },
    receive: { title: "Receive", description: "From another wallet" },
    buy: { title: "Buy", description: "With card or bank" },
  },
};

function setup(overrides: Partial<DepositOptionsProps> = {}) {
  const props: DepositOptionsProps = {
    isOpen: true,
    labels: LABELS,
    page: "Pay",
    onClose: jest.fn(),
    onSelect: jest.fn(),
    onTrackEvent: jest.fn(),
    ...overrides,
  };
  const { result } = renderHook(() => useDepositOptionsViewModel(props));
  return { props, result };
}

describe("useDepositOptionsViewModel", () => {
  it("builds the four options in a fixed order", () => {
    const { result } = setup();

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

    expect(props.onTrackEvent).toHaveBeenCalledWith("button_clicked", {
      button: "receive via crypto address",
      buttonLocation: "deposit",
      page: "Pay",
    });
    expect(props.onSelect).toHaveBeenCalledWith("receive");
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("does not throw when no tracker is provided", () => {
    const { props, result } = setup({ onTrackEvent: undefined });

    expect(() => result.current.onSelectOption("swap")).not.toThrow();
    expect(props.onSelect).toHaveBeenCalledWith("swap");
  });
});

import React from "react";
import { render, screen, fireEvent } from "tests/testSetup";
import StepOptions from "./StepOptions";
import { StepProps } from "../Body";

jest.mock("react-i18next", () => ({
  ...jest.requireActual("react-i18next"),
  Trans: ({ i18nKey }: { i18nKey: string }) => <span>{i18nKey}</span>,
}));

const mockPush = jest.fn();

jest.mock("react-router", () => ({
  // Use the actual implementation for all other exports
  ...jest.requireActual("react-router"),
  // Override the useHistory hook
  useHistory: () => ({
    push: mockPush,
  }),
}));

const mockTransitionTo = jest.fn();
const mockCloseModal = jest.fn();

function renderComponent() {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const props = {
    eventType: "testEvent",
    transitionTo: mockTransitionTo,
    closeModal: mockCloseModal,
  } as unknown as Readonly<StepProps>;

  return render(<StepOptions {...props} />);
}

describe("StepOptions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls transitionTo('account') when first option is clicked", () => {
    renderComponent();
    const cryptoOption = screen.getByTestId("fromCrypto");
    fireEvent.click(cryptoOption);
    expect(mockTransitionTo).toHaveBeenCalledWith("account");
  });

  it("calls closeModal and navigates when second option is clicked", () => {
    renderComponent();
    const bankOption = screen.getByTestId("fromBank");
    fireEvent.click(bankOption);
    expect(mockCloseModal).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/receive",
    });
  });
});

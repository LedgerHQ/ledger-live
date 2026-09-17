/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "tests/testSetup";
import { SelfTransferSection } from "../SelfTransferSection";
import * as viewModelModule from "../useSelfTransferSectionViewModel";

jest.mock("../useSelfTransferSectionViewModel");

const mockedUseViewModel = jest.mocked(viewModelModule.useSelfTransferSectionViewModel);

const PRIVATE_TARGET = {
  address: "zs1pooladdress",
  translationKey: "recipient.selfTransfer.toPrivate",
  isDestinationPublic: false,
};

describe("SelfTransferSection", () => {
  const mockOnSelfTransfer = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseViewModel.mockReturnValue({
      target: PRIVATE_TARGET,
      onSelfTransfer: mockOnSelfTransfer,
      isBlocked: false,
    });
  });

  it("should call onSelfTransfer with the translated display label when clicked", async () => {
    const { user } = render(<SelfTransferSection />);

    await user.click(screen.getByTestId("self-transfer-button"));

    expect(mockOnSelfTransfer).toHaveBeenCalledWith("Private balance");
  });

  it("should not call onSelfTransfer when the family notice blocks the recipient step", async () => {
    mockedUseViewModel.mockReturnValue({
      target: PRIVATE_TARGET,
      onSelfTransfer: mockOnSelfTransfer,
      isBlocked: true,
    });
    const { user } = render(<SelfTransferSection />);

    await user.click(screen.getByTestId("self-transfer-button"));

    expect(mockOnSelfTransfer).not.toHaveBeenCalled();
  });

  it("should render nothing when the view model returns null", () => {
    mockedUseViewModel.mockReturnValue(null);
    const { container } = render(<SelfTransferSection />);

    expect(container).toBeEmptyDOMElement();
  });
});

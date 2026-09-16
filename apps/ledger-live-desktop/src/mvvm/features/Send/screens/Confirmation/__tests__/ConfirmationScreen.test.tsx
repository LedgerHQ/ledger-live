/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "tests/testSetup";
import { FLOW_STATUS } from "@ledgerhq/live-common/flows/wizard/types";
import { useConfirmationViewModel } from "../hooks/useConfirmationViewModel";
import { ConfirmationScreen } from "../ConfirmationScreen";

jest.mock("@ledgerhq/lumen-ui-react", () => {
  const actual = jest.requireActual("@ledgerhq/lumen-ui-react");
  return {
    ...actual,
    DialogBody: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  };
});

jest.mock("../hooks/useConfirmationViewModel", () => ({
  useConfirmationViewModel: jest.fn(),
}));

jest.mock("../components/FamilyPostBroadcastEffect", () => ({
  FamilyPostBroadcastEffect: () => <div data-testid="family-post-broadcast-effect" />,
}));

const mockedUseConfirmationViewModel = jest.mocked(useConfirmationViewModel);

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseConfirmationViewModel.mockReturnValue({
    status: FLOW_STATUS.SUCCESS,
    transactionError: null,
    onViewDetails: jest.fn(),
    onRetry: jest.fn(),
    onClose: jest.fn(),
  });
});

describe("ConfirmationScreen", () => {
  it("mounts the family post-broadcast effect alongside the confirmation body", () => {
    render(<ConfirmationScreen />);

    expect(screen.getByTestId("family-post-broadcast-effect")).toBeVisible();
    expect(screen.getByTestId("send-confirmation-step")).toBeVisible();
  });
});

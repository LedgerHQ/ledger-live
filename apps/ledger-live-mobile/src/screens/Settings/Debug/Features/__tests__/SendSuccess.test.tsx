import React from "react";
import { render, screen } from "@tests/test-renderer";
import DebugSendSuccess from "../SendSuccess";

const goBack = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ goBack }),
}));

describe("DebugSendSuccess", () => {
  beforeEach(() => {
    goBack.mockClear();
  });

  it("should open the Send confirmation success screen", async () => {
    const { user } = render(<DebugSendSuccess />);

    expect(await screen.findByTestId("send-confirmation-success")).toBeVisible();
    expect(screen.getByText("Transaction signed")).toBeVisible();
    expect(screen.queryByTestId("send-confirmation-success-view-transaction")).toBeNull();

    await user.press(screen.getByTestId("send-confirmation-success-close"));
    expect(goBack).toHaveBeenCalledTimes(1);
  });
});

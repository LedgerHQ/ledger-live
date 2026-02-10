import * as React from "react";
import { render, screen, waitFor } from "@tests/test-renderer";
import { TestSendFlowWrapper, overrideStateWithAccounts } from "./shared";

describe("Send Flow Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should display recipient screen when Send flow is opened", async () => {
    render(<TestSendFlowWrapper />, {
      overrideInitialState: overrideStateWithAccounts,
    });

    await waitFor(() => {
      expect(screen.getByText(/recipient screen/i)).toBeVisible();
    });
  });

  it("should display continue button on recipient screen", async () => {
    render(<TestSendFlowWrapper />, {
      overrideInitialState: overrideStateWithAccounts,
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /continue/i })).toBeVisible();
    });
  });

  it("should navigate to amount screen when continue is pressed on recipient screen", async () => {
    const { user } = render(<TestSendFlowWrapper />, {
      overrideInitialState: overrideStateWithAccounts,
    });

    await waitFor(() => {
      expect(screen.getByText(/recipient screen/i)).toBeVisible();
    });

    await user.press(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByText(/amount screen/i)).toBeVisible();
    });
  });

  it("should navigate through flow steps: recipient → amount → confirmation", async () => {
    const { user } = render(<TestSendFlowWrapper />, {
      overrideInitialState: overrideStateWithAccounts,
    });

    await waitFor(() => {
      expect(screen.getByText(/recipient screen/i)).toBeVisible();
    });

    await user.press(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByText(/amount screen/i)).toBeVisible();
    });

    await user.press(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByText(/confirmation screen/i)).toBeVisible();
    });
  });
});

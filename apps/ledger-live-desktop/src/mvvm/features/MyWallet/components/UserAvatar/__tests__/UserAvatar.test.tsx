import React from "react";
import { render, screen } from "tests/testSetup";
import { useNotificationIndicator } from "LLD/components/TopBar/hooks/useNotificationIndicator";
import { UserAvatar } from "../index";

jest.mock("LLD/components/TopBar/hooks/useNotificationIndicator");

jest.mocked(useNotificationIndicator).mockReturnValue({
  totalNotifCount: 2,
  tooltip: "",
  onClick: jest.fn(),
  icon: Object.assign(jest.fn(), { displayName: "MockIcon" }),
  isInteractive: true,
});

describe("UserAvatar (container)", () => {
  it("wires the view model to the view", () => {
    render(<UserAvatar />);

    expect(screen.getByTestId("my-wallet-avatar")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Avatar, 2 unseen notifications" })).toBeInTheDocument();
  });
});

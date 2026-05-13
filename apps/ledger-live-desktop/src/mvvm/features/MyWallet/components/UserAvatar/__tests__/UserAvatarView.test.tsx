import React from "react";
import { render, screen } from "tests/testSetup";
import { UserAvatarView } from "../UserAvatarView";

describe("UserAvatarView", () => {
  it.each([
    { showNotification: false, unseenCount: 0, expectedLabel: "Avatar" },
    { showNotification: true, unseenCount: 1, expectedLabel: "Avatar, 1 unseen notification" },
    { showNotification: true, unseenCount: 5, expectedLabel: "Avatar, 5 unseen notifications" },
  ])(
    "renders aria-label '$expectedLabel' for showNotification=$showNotification, unseenCount=$unseenCount",
    ({ showNotification, unseenCount, expectedLabel }) => {
      render(<UserAvatarView showNotification={showNotification} unseenCount={unseenCount} />);

      expect(screen.getByTestId("my-wallet-avatar")).toBeInTheDocument();
      expect(screen.getByRole("img", { name: expectedLabel })).toBeInTheDocument();
    },
  );
});

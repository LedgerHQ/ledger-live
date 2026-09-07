import React from "react";
import { fireEvent, render, screen } from "@tests/test-renderer";
import { NotificationsPromptDrawerView } from "../NotificationsPromptDrawerView";

jest.mock("LLM/features/NotificationsPrompt/components/NotificationsDrawerIllustration", () => ({
  NotificationsDrawerIllustration: () => null,
}));
jest.mock("LLM/features/NotificationsPrompt/components/NotificationsPromptContent", () => ({
  NotificationsPromptContent: () => null,
}));
describe("NotificationsPromptDrawerView", () => {
  it("should call onAllow and onLater from the prompt actions", () => {
    const onAllow = jest.fn();
    const onLater = jest.fn();

    render(
      <NotificationsPromptDrawerView
        promptTarget="globalPushNotifications"
        onAllow={onAllow}
        onLater={onLater}
      />,
    );

    fireEvent.press(screen.getByTestId("notifications-prompt-allow"));
    fireEvent.press(screen.getByTestId("notifications-prompt-later"));

    expect(onAllow).toHaveBeenCalledTimes(1);
    expect(onLater).toHaveBeenCalledTimes(1);
  });
});

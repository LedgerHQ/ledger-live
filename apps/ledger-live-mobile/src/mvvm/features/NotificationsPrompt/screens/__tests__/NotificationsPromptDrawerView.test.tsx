import React from "react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { fireEvent, render, screen } from "@testing-library/react-native";
import StyleProvider from "~/StyleProvider";
import settings from "~/reducers/settings";
import { NotificationsPromptDrawerView } from "../NotificationsPromptDrawerView";

jest.mock("~/images/illustration/Illustration", () => "Illustration");
jest.mock("~/context/Locale", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
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
    const store = configureStore({ reducer: { settings } });

    render(
      <Provider store={store}>
        <StyleProvider selectedPalette="dark">
          <NotificationsPromptDrawerView
            promptTarget="globalPushNotifications"
            onAllow={onAllow}
            onLater={onLater}
          />
        </StyleProvider>
      </Provider>,
    );

    fireEvent.press(screen.getByTestId("notifications-prompt-allow"));
    fireEvent.press(screen.getByTestId("notifications-prompt-later"));

    expect(onAllow).toHaveBeenCalledTimes(1);
    expect(onLater).toHaveBeenCalledTimes(1);
  });
});

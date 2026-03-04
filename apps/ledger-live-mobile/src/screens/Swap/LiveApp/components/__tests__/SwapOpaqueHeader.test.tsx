import React from "react";
import { render } from "@tests/test-renderer";
import { SwapOpaqueHeader } from "../SwapOpaqueHeader";

jest.mock("~/context/Locale", () => ({
  ...jest.requireActual("~/context/Locale"),
  useTranslation: () => ({ t: (key: string) => `translated:${key}` }),
}));

describe("SwapOpaqueHeader", () => {
  it("should render translated title and call onBackPress when back is pressed", async () => {
    const onBackPress = jest.fn();
    const { user, getByTestId, getByText } = render(
      <SwapOpaqueHeader onBackPress={onBackPress} titleKey="transfer.swap2.quotesList.title" />,
    );

    expect(getByText("translated:transfer.swap2.quotesList.title")).toBeTruthy();

    await user.press(getByTestId("swap-topbar-back"));

    expect(onBackPress).toHaveBeenCalledTimes(1);
  });

  it("should render close button and hide back button when requested", async () => {
    const onBackPress = jest.fn();
    const onClosePress = jest.fn();
    const { user, queryByTestId, getByTestId } = render(
      <SwapOpaqueHeader
        onBackPress={onBackPress}
        onClosePress={onClosePress}
        showBackButton={false}
        titleKey="transfer.swap2.twoStepApproval.completedTitle"
      />,
    );

    expect(queryByTestId("swap-topbar-back")).toBeNull();

    await user.press(getByTestId("swap-topbar-close"));

    expect(onBackPress).not.toHaveBeenCalled();
    expect(onClosePress).toHaveBeenCalledTimes(1);
  });
});

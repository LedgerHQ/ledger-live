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
});

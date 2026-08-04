import React from "react";
import { Linking } from "react-native";
import { fireEvent, render, screen } from "@tests/test-renderer";
import { urls } from "~/utils/urls";
import { ContactsSanctionedAddressBanner } from "./ContactsSanctionedAddressBanner";

jest.mock("LLM/hooks/useLocalizedUrls", () => ({
  useLocalizedUrl: (url: string) => url,
}));

describe("ContactsSanctionedAddressBanner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
  });

  it("should show the sanctioned-address feedback and open the Help Center", () => {
    render(<ContactsSanctionedAddressBanner />);

    expect(
      screen.getByText("This wallet address is sanctioned by international laws and regulations."),
    ).toBeVisible();

    fireEvent.press(screen.getByRole("button", { name: "Learn more" }));

    expect(Linking.openURL).toHaveBeenCalledWith(urls.resources.helpCenter);
  });
});

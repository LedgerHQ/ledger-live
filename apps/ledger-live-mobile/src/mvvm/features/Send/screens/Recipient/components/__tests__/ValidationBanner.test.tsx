import React from "react";
import { Linking } from "react-native";
import { render, screen } from "@tests/test-renderer";
import { urls } from "~/utils/urls";
import { ValidationBanner } from "../ValidationBanner";

function makeError(name: string) {
  const error = new Error();
  error.name = name;
  return error;
}

describe("ValidationBanner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("opens the error's support article from Learn more", async () => {
    const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
    const { user } = render(
      <ValidationBanner
        type="warning"
        warning={makeError("XrpSendToIssuer")}
        variant="recipient"
      />,
    );

    await user.press(screen.getByText("Learn more"));

    expect(openURL).toHaveBeenCalledTimes(1);
    expect(openURL).toHaveBeenCalledWith(urls.errors.XrpSendToIssuer);
  });

  it("shows no Learn more for an error without a support article", () => {
    render(
      <ValidationBanner
        type="error"
        error={makeError("XrpRecipientNotActivated")}
        variant="recipient"
      />,
    );

    expect(screen.getByText("This account isn't activated")).toBeVisible();
    expect(screen.queryByText("Learn more")).toBeNull();
  });
});

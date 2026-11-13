import React from "react";
import { render, screen } from "tests/testSetup";
import { openURL } from "~/renderer/linking";
import { urls } from "~/config/urls";
import { ValidationBanner } from "../ValidationBanner";

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

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
    const { user } = render(
      <ValidationBanner
        type="warning"
        warning={makeError("XrpSendToIssuer")}
        variant="recipient"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Learn more" }));

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

    expect(screen.getByTestId("recipient-error-banner")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Learn more" })).not.toBeInTheDocument();
  });
});

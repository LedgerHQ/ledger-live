/**
 * @jest-environment jsdom
 */
import { RecipientRequired } from "@ledgerhq/errors";
import React from "react";
import { render, screen } from "tests/testSetup";
import { openURL } from "~/renderer/linking";
import { useTranslatedBridgeError } from "../../hooks/useTranslatedBridgeError";
import { ValidationBanner } from "../ValidationBanner";

jest.mock("../../hooks/useTranslatedBridgeError");

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

jest.mock("~/renderer/hooks/useLocalizedUrls", () => ({
  useLocalizedUrl: () => "https://support.ledger.com/help",
}));

const mockedUseTranslatedBridgeError = jest.mocked(useTranslatedBridgeError);
const mockedOpenURL = jest.mocked(openURL);

describe("ValidationBanner", () => {
  beforeEach(() => {
    mockedUseTranslatedBridgeError.mockReturnValue(null);
  });

  describe("sanctioned variant", () => {
    it("renders the sanctioned banner and opens the help center on action click", async () => {
      const { user } = render(<ValidationBanner type="sanctioned" />);

      expect(screen.getByTestId("sanctioned-address-banner")).toBeInTheDocument();

      await user.click(screen.getByRole("button"));
      expect(mockedOpenURL).toHaveBeenCalledWith("https://support.ledger.com/help");
    });
  });

  describe("recipient error variant", () => {
    it("renders the recipient error banner when a translated error is available", () => {
      mockedUseTranslatedBridgeError.mockReturnValue({
        title: "translated-title",
        description: "translated-description",
      });

      render(
        <ValidationBanner
          type="error"
          variant="recipient"
          error={new Error("Invalid recipient")}
        />,
      );

      expect(screen.getByTestId("recipient-error-banner")).toBeInTheDocument();
    });

    it("renders nothing when no error is provided", () => {
      const { container } = render(<ValidationBanner type="error" variant="recipient" />);
      expect(container).toBeEmptyDOMElement();
    });

    it("renders nothing when the error has no translation", () => {
      mockedUseTranslatedBridgeError.mockReturnValue(null);

      const { container } = render(
        <ValidationBanner type="error" variant="recipient" error={new Error("Untranslated")} />,
      );
      expect(container).toBeEmptyDOMElement();
    });

    it("filters out RecipientRequired errors when excludeRecipientRequired is set", () => {
      mockedUseTranslatedBridgeError.mockReturnValue({
        title: "translated-title",
      });

      const { container } = render(
        <ValidationBanner
          type="error"
          variant="recipient"
          error={new RecipientRequired()}
          excludeRecipientRequired
        />,
      );
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("sender warning variant", () => {
    it("renders the sender warning banner when a translated warning is available", () => {
      mockedUseTranslatedBridgeError.mockReturnValue({
        title: "translated-title",
        description: "translated-description",
      });

      render(
        <ValidationBanner
          type="warning"
          variant="sender"
          warning={new Error("Sender warning")}
        />,
      );

      expect(screen.getByTestId("sender-warning-banner")).toBeInTheDocument();
    });
  });
});

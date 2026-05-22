/**
 * @jest-environment jsdom
 */
import { RecipientRequired } from "@ledgerhq/errors";
import React from "react";
import { render, screen } from "tests/testSetup";
import { openURL } from "~/renderer/linking";
import { useTranslatedBridgeError } from "../../hooks/useTranslatedBridgeError";
import { ValidationBanner } from "../ValidationBanner";

jest.mock("react-i18next", () => ({
  ...jest.requireActual("react-i18next"),
  useTranslation: () => ({
    t: (key: string) => {
      if (key === "newSendFlow.sanctioned.description")
        return "This address is flagged as sanctioned.";
      if (key === "newSendFlow.sanctioned.helpCenter") return "Learn more";
      return key;
    },
  }),
}));

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
    it("renders the sanctioned banner with title, description and help center action", async () => {
      const { user } = render(<ValidationBanner type="sanctioned" />);

      expect(screen.getByTestId("sanctioned-address-banner")).toBeInTheDocument();
      expect(screen.getByText("Flagged address")).toBeInTheDocument();
      expect(screen.getByText("This address is flagged as sanctioned.")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Learn more" }));
      expect(mockedOpenURL).toHaveBeenCalledWith("https://support.ledger.com/help");
    });
  });

  describe("recipient error variant", () => {
    it("renders the recipient error banner when a translated error is available", () => {
      mockedUseTranslatedBridgeError.mockReturnValue({
        title: "Invalid recipient",
        description: "The recipient address is not valid.",
      });

      render(
        <ValidationBanner
          type="error"
          variant="recipient"
          error={new Error("Invalid recipient")}
        />,
      );

      expect(screen.getByTestId("recipient-error-banner")).toBeInTheDocument();
      expect(screen.getByText("Invalid recipient")).toBeInTheDocument();
      expect(screen.getByText("The recipient address is not valid.")).toBeInTheDocument();
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
        title: "Recipient required",
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
    it("renders the sender warning banner with the translated warning", () => {
      mockedUseTranslatedBridgeError.mockReturnValue({
        title: "Keeping you safe",
        description: "This sender address is flagged.",
      });

      render(
        <ValidationBanner
          type="warning"
          variant="sender"
          warning={new Error("Sender warning")}
        />,
      );

      expect(screen.getByTestId("sender-warning-banner")).toBeInTheDocument();
      expect(screen.getByText("Keeping you safe")).toBeInTheDocument();
      expect(screen.getByText("This sender address is flagged.")).toBeInTheDocument();
    });
  });
});

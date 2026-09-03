import React from "react";
import { fireEvent, render as rntlRender, screen } from "@testing-library/react-native";
import { ThemeProvider } from "@ledgerhq/lumen-ui-rnative";
import { ledgerLiveThemes } from "@ledgerhq/lumen-design-core";

import { SendHeader } from "../SendHeader";
import { useSendHeaderViewModel } from "../../hooks/useSendHeaderViewModel";
import { useSendFlowData } from "../../context/SendFlowContext";

jest.mock("../../hooks/useSendHeaderViewModel");
jest.mock("../../context/SendFlowContext");
jest.mock("~/context/Locale", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("~/analytics", () => ({
  useAnalytics: () => ({ track: jest.fn() }),
  usePageNameFromRoute: () => "step amount",
  track: jest.fn(),
}));
jest.mock("../AddressDisclaimer", () => ({ AddressDisclaimer: () => null }));

function render(ui: React.ReactElement) {
  return rntlRender(
    <ThemeProvider themes={ledgerLiveThemes} colorScheme="dark">
      {ui}
    </ThemeProvider>,
  );
}

const mockedUseSendHeaderViewModel = jest.mocked(useSendHeaderViewModel);
const mockedUseSendFlowData = jest.mocked(useSendFlowData);

const baseViewModel = {
  title: "Send ETH",
  descriptionText: "Base 1 · $5,969.83",
  showTitle: true,
  showHeaderRight: true,
  canGoBack: true,
  isRecipientStep: false,
  isAmountStep: true,
  showRecipientInput: true,
  recipientSearch: { value: "", setValue: jest.fn(), clear: jest.fn() },
  formattedAddress: "0x123456...12345678",
  recipientContact: undefined,
  recipientPlaceholder: "placeholder",
  handleBackPress: jest.fn(),
  handleClose: jest.fn(),
  handleRecipientInputPress: jest.fn(),
  setRecipientSearchValue: jest.fn(),
  clearRecipientSearch: jest.fn(),
  handleQrCodeClick: jest.fn(),
  handleRecipientInputChange: jest.fn(),
};

describe("SendHeader", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseSendFlowData.mockReturnValue({
      state: { account: { account: null, parentAccount: null } },
    } as never);
  });

  it("shows the contact avatar and name when the recipient is a contact", () => {
    mockedUseSendHeaderViewModel.mockReturnValue({
      ...baseViewModel,
      formattedAddress: "Benoit Jean",
      recipientContact: { id: "contact-benoit", name: "Benoit Jean" },
    });

    render(<SendHeader />);

    expect(screen.getByTestId("recipient-contact-avatar")).toBeVisible();
    expect(screen.getByText("BJ")).toBeVisible();
    expect(screen.getByText("Benoit Jean")).toBeVisible();
  });

  it("falls back to the address input when the recipient is not a contact", () => {
    mockedUseSendHeaderViewModel.mockReturnValue(baseViewModel);

    render(<SendHeader />);

    expect(screen.queryByTestId("recipient-contact-row")).toBeNull();
    expect(screen.getByDisplayValue("0x123456...12345678")).toBeVisible();
  });

  it.each([
    ["a contact", { id: "contact-benoit", name: "Benoit Jean" }],
    ["a plain address", undefined],
  ])("goes back to the recipient step when pressing the header showing %s", (_, contact) => {
    const handleRecipientInputPress = jest.fn();
    mockedUseSendHeaderViewModel.mockReturnValue({
      ...baseViewModel,
      recipientContact: contact,
      handleRecipientInputPress,
    });

    render(<SendHeader />);
    fireEvent.press(screen.getByLabelText("send.newSendFlow.editRecipientAccessibilityLabel"));

    expect(handleRecipientInputPress).toHaveBeenCalled();
  });
});

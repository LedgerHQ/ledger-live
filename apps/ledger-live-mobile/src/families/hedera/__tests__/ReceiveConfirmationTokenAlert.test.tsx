import React from "react";
import { render, screen } from "@tests/test-renderer";
import { NavigatorName, ScreenName } from "~/const";
import ReceiveConfirmationTokenAlert from "../ReceiveConfirmationTokenAlert";
import { HEDERA_ACCOUNT_1 } from "../__mocks__/account.mock";
import { htsToken } from "../__mocks__/currency.mock";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

describe("Hedera ReceiveConfirmationTokenAlert", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it("opens the association summary for the known token", async () => {
    const { user } = render(
      <ReceiveConfirmationTokenAlert
        account={HEDERA_ACCOUNT_1}
        mainAccount={HEDERA_ACCOUNT_1}
        token={htsToken}
      />,
    );

    await user.press(screen.getByText("click here"));

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.HederaAssociateTokenFlow, {
      screen: ScreenName.HederaAssociateTokenSummary,
      params: { accountId: HEDERA_ACCOUNT_1.id, token: htsToken },
    });
  });

  it("opens the token selection when no token is known", async () => {
    const { user } = render(
      <ReceiveConfirmationTokenAlert account={HEDERA_ACCOUNT_1} mainAccount={HEDERA_ACCOUNT_1} />,
    );

    await user.press(screen.getByText("click here"));

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.HederaAssociateTokenFlow, {
      screen: ScreenName.HederaAssociateTokenSelectToken,
      params: { accountId: HEDERA_ACCOUNT_1.id },
    });
  });
});

import React from "react";
import { render } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import ConnectDevice from "../ConnectDevice";

const mockNavigate = jest.fn();

jest.mock("LLM/hooks/useAccountScreen", () => ({
  useAccountScreen: jest.fn(),
}));

const { useAccountScreen } = jest.requireMock("LLM/hooks/useAccountScreen");

const baseRoute = {
  key: "test-key",
  name: ScreenName.ReceiveConnectDevice as const,
  params: {
    accountId: "concordium-account-1",
    parentId: undefined,
  },
};

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const baseNavigation = {
  navigate: mockNavigate,
} as unknown as Parameters<typeof ConnectDevice>[0]["navigation"];

describe("ConnectDevice (Concordium)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should navigate directly to ReceiveConfirmation, skipping device verification", () => {
    useAccountScreen.mockReturnValue({
      account: { id: "concordium-account-1", type: "Account" },
      parentAccount: null,
    });

    render(<ConnectDevice navigation={baseNavigation} route={baseRoute} />);

    expect(mockNavigate).toHaveBeenCalledWith(ScreenName.ReceiveConfirmation, {
      accountId: "concordium-account-1",
      parentId: undefined,
    });
  });

  it("should not navigate when account is missing", () => {
    useAccountScreen.mockReturnValue({
      account: undefined,
      parentAccount: null,
    });

    render(<ConnectDevice navigation={baseNavigation} route={baseRoute} />);

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

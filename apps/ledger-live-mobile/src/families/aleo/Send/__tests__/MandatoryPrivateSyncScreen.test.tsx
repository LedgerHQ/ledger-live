import React from "react";
import { View, Text } from "react-native";
import { act, render } from "@tests/test-renderer";
import { MandatoryPrivateSyncScreen } from "../MandatoryPrivateSyncScreen";
import { ScreenName } from "~/const";
import { ALEO_ACCOUNT_1 } from "../../__mocks__/account.mock";

jest.mock("@ledgerhq/lumen-ui-rnative", () => {
  const actual = jest.requireActual("@ledgerhq/lumen-ui-rnative");

  return {
    ...actual,
    Box: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    Text: ({ children }: { children: React.ReactNode }) => <Text>{children}</Text>,
    Spinner: () => <View testID="spinner" />,
  };
});

const mockTransaction = { family: "aleo", recipient: "aleo1abc" } as never;

function makeNavigation() {
  return { replace: jest.fn() };
}

function makeRoute() {
  return {
    key: "aleo-private-sync",
    name: "AleoMandatoryPrivateSync" as const,
    params: { account: ALEO_ACCOUNT_1, parentAccount: undefined, transaction: mockTransaction },
  };
}

describe("MandatoryPrivateSyncScreen", () => {
  const mockNavigation = makeNavigation();
  const mockRoute = makeRoute();

  beforeEach(() => {
    jest.useFakeTimers();
    mockNavigation.replace.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("navigates to SendAmountCoin after 2 seconds", () => {
    render(
      <MandatoryPrivateSyncScreen
        navigation={mockNavigation as never}
        route={mockRoute as never}
      />,
    );

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(mockNavigation.replace).toHaveBeenCalledTimes(1);
    expect(mockNavigation.replace).toHaveBeenCalledWith(
      ScreenName.SendAmountCoin,
      expect.objectContaining({
        accountId: ALEO_ACCOUNT_1.id,
        transaction: mockTransaction,
      }),
    );
  });

  it("does not navigate before 2 seconds have elapsed", () => {
    render(
      <MandatoryPrivateSyncScreen
        navigation={mockNavigation as never}
        route={mockRoute as never}
      />,
    );

    act(() => {
      jest.advanceTimersByTime(1999);
    });

    expect(mockNavigation.replace).not.toHaveBeenCalled();
  });

  it("cancels the timer on unmount", () => {
    const { unmount } = render(
      <MandatoryPrivateSyncScreen
        navigation={mockNavigation as never}
        route={mockRoute as never}
      />,
    );

    unmount();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(mockNavigation.replace).not.toHaveBeenCalled();
  });
});

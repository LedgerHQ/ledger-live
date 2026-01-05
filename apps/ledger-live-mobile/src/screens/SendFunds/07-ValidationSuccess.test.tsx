import React from "react";
import { render, screen } from "@tests/test-renderer";
import { State } from "~/reducers/types";
import { genAccount } from "@ledgerhq/live-common/mock/account";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import ValidationSuccess from "./07-ValidationSuccess";

const mockTryTriggerPushNotificationDrawerAfterAction = jest.fn();

jest.mock("~/logic/notifications", () => ({
  useNotifications: () => ({
    tryTriggerPushNotificationDrawerAfterAction: mockTryTriggerPushNotificationDrawerAfterAction,
  }),
}));

jest.mock("@ledgerhq/live-common/account/helpers", () => ({
  getAccountCurrency: jest.fn(() => ({
    name: "Bitcoin",
    ticker: "BTC",
  })),
}));

const mockAccount = genAccount("account-1", { currency: getCryptoCurrencyById("bitcoin") });

const mockOperation = {
  id: "op-1",
  hash: "0x123",
  type: "OUT",
  value: "1000000",
  fee: "1000",
  date: new Date(),
  blockHeight: 123456,
  blockHash: "0xabc",
  accountId: mockAccount.id,
  senders: ["sender-address"],
  recipients: ["recipient-address"],
};

const mockNavigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
  getParent: jest.fn(() => ({
    pop: jest.fn(),
  })),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

const setup = () => {
  const mockRoute = {
    params: {
      accountId: mockAccount.id,
      result: mockOperation,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  return render(<ValidationSuccess navigation={mockNavigation} route={mockRoute} />, {
    overrideInitialState: (state: State) => ({
      ...state,
      accounts: {
        ...state.accounts,
        active: [mockAccount],
      },
    }),
  });
};

describe("SendFunds ValidationSuccess", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the success screen", () => {
    setup();
    expect(screen.getByTestId("validate-success-screen")).toBeTruthy();
  });

  it("should trigger push notification drawer after action with 'send'", () => {
    setup();
    expect(mockTryTriggerPushNotificationDrawerAfterAction).toHaveBeenCalledWith("send");
    expect(mockTryTriggerPushNotificationDrawerAfterAction).toHaveBeenCalledTimes(1);
  });
});

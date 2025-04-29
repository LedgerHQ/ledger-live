import React from "react";
import { screen } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import SendSelectRecipient from "./02-SelectRecipient";
import { Account } from "@ledgerhq/types-live";
import * as useBridgeTransactionModule from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { RouteProp } from "@react-navigation/core";
import { ScreenName } from "~/const";
import { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: jest.fn().mockReturnValue({}),
}));
jest.mock("@react-native-clipboard/clipboard", () => ({}));
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useScrollToTop: jest.fn(),
}));

describe("SendSelectRecipient", () => {
  it.each([
    ["transfer fee", "transferFee"],
    ["transfer hook", "transferHook"],
  ])("displays a warning when the token embeds the %s extension", (_s, extension) => {
    jest.spyOn(useBridgeTransactionModule, "default").mockReturnValue({
      transaction: { recipient: "" },
      status: { errors: {}, warnings: {} },
    } as unknown as useBridgeTransactionModule.Result);

    render(
      <SendSelectRecipient
        route={
          {
            params: {
              accountId: "accountId",
              parentId: "parentId",
            },
          } as unknown as RouteProp<
            SendFundsNavigatorStackParamList,
            ScreenName.SendSelectRecipient
          >
        }
      />,
      {
        overrideInitialState: state => ({
          ...state,
          accounts: {
            active: [
              {
                id: "parentId",
                type: "Account",
                currency: { units: [] },
                subAccounts: [
                  {
                    id: "accountId",
                    type: "TokenAccount",
                    token: {},
                    extensions: {
                      [extension]: {},
                    },
                  },
                ],
              } as unknown as Account,
            ],
          },
        }),
      },
    );

    expect(screen.queryByTestId("spl-2022-problematic-extension")).toHaveTextContent(
      "You are interacting with a token that is part of the Token-2022 program, also known as Token Extensions. This token comes with specific risks. Click here to learn more.",
    );
  });

  it("does not display any warning with no problematic token extensions", () => {
    render(
      <SendSelectRecipient
        route={
          {
            params: {
              accountId: "accountId",
              parentId: "parentId",
            },
          } as unknown as RouteProp<
            SendFundsNavigatorStackParamList,
            ScreenName.SendSelectRecipient
          >
        }
      />,
      {
        overrideInitialState: state => ({
          ...state,
          accounts: {
            active: [
              {
                id: "parentId",
                type: "Account",
                currency: { units: [] },
                subAccounts: [
                  {
                    id: "accountId",
                    type: "TokenAccount",
                    token: {},
                    extensions: {},
                  },
                ],
              } as unknown as Account,
            ],
          },
        }),
      },
    );

    expect(screen.queryByTestId("spl-2022-problematic-extension")).toBeNull();
  });
});

import React from "react";
import { Linking } from "react-native";
import { render, screen } from "@tests/test-renderer";
import { EarnMenuBottomSheet } from "../EarnMenuBottomSheet";
import { State } from "~/reducers/types";
import { track } from "~/analytics";
import { NavigatorName, ScreenName } from "~/const";

jest.mock("~/analytics", () => ({ track: jest.fn() }));

const mockNavigate = jest.fn();
const mockRouteParams = { existingParam: "value" };

jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");
  return {
    ...actual,
    useRoute: () => ({ params: mockRouteParams }),
  };
});

jest.mock("@ledgerhq/lumen-ui-rnative", () => {
  const React = require("react");
  const RN = require("react-native");
  const actual = jest.requireActual("@ledgerhq/lumen-ui-rnative");
  return {
    ...actual,
    BottomSheetView: ({ children }: { children: React.ReactNode }) => <RN.View>{children}</RN.View>,
    BottomSheetHeader: () => <RN.View testID="bottom-sheet-header" />,
    ListItem: ({
      children,
      onPress,
    }: {
      children: React.ReactNode;
      onPress: () => void;
      key: string;
    }) => (
      <RN.Pressable testID="list-item" onPress={onPress}>
        {children}
      </RN.Pressable>
    ),
    ListItemContent: ({ children }: { children: React.ReactNode }) => <RN.View>{children}</RN.View>,
    ListItemLeading: ({ children }: { children: React.ReactNode }) => <RN.View>{children}</RN.View>,
    ListItemSpot: () => <RN.View testID="list-item-spot" />,
    ListItemTitle: ({ children }: { children: React.ReactNode }) => <RN.Text>{children}</RN.Text>,
  };
});

jest.mock("LLM/components/QueuedDrawer/QueuedDrawerBottomSheet", () => {
  const { View, Text, Pressable } = require("react-native");
  return function MockQueuedDrawerBottomSheet({
    children,
    onClose,
    isRequestingToBeOpened,
  }: {
    children: React.ReactNode;
    onClose: () => void;
    isRequestingToBeOpened: boolean;
  }) {
    return (
      <View testID="queued-drawer-bottom-sheet">
        <Text testID="is-requesting-to-be-opened">{isRequestingToBeOpened ? "true" : "false"}</Text>
        {children}
        <Pressable testID="close-bottom-sheet" onPress={onClose}>
          <Text>Close</Text>
        </Pressable>
      </View>
    );
  };
});

const navigation = { navigate: mockNavigate } as any;

const renderEarnMenuBottomSheet = (menuBottomSheet: State["earn"]["menuBottomSheet"]) =>
  render(<EarnMenuBottomSheet navigation={navigation} />, {
    overrideInitialState: (state: State) => ({
      ...state,
      earn: {
        ...state.earn,
        menuBottomSheet,
      },
    }),
  });

describe("EarnMenuBottomSheet", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render without crashing when menu bottom sheet state is undefined", () => {
    const { getByTestId } = renderEarnMenuBottomSheet(undefined);

    expect(getByTestId("queued-drawer-bottom-sheet")).toBeTruthy();
  });

  it("should pass isRequestingToBeOpened false when options are empty", () => {
    renderEarnMenuBottomSheet(undefined);

    expect(screen.getByTestId("is-requesting-to-be-opened")).toHaveTextContent("false");
  });

  it("should pass isRequestingToBeOpened true when options are present", () => {
    renderEarnMenuBottomSheet([
      {
        icon: "Plus",
        label: "Stake",
        metadata: { button: "stake", live_app: "earn", flow: "stake", link: "https://earn.app" },
      },
    ]);

    expect(screen.getByTestId("is-requesting-to-be-opened")).toHaveTextContent("true");
  });

  it("should render all menu option labels", () => {
    renderEarnMenuBottomSheet([
      {
        icon: "Plus",
        label: "Stake ETH",
        metadata: {
          button: "stake",
          live_app: "earn",
          flow: "stake",
          link: "https://earn.app?intent=deposit",
        },
      },
      {
        icon: "ArrowDown",
        label: "Withdraw ETH",
        metadata: {
          button: "withdraw",
          live_app: "earn",
          flow: "withdraw",
          link: "https://earn.app?intent=withdraw",
        },
      },
    ]);

    expect(screen.getByText("Stake ETH")).toBeTruthy();
    expect(screen.getByText("Withdraw ETH")).toBeTruthy();
  });

  it("should not render options without a link in metadata", () => {
    renderEarnMenuBottomSheet([
      {
        icon: "Plus",
        label: "No Link Option",
        metadata: { button: "btn", live_app: "earn", flow: "f" },
      },
    ]);

    expect(screen.queryByText("No Link Option")).toBeNull();
  });

  it("should clear menu bottom sheet state when close is pressed", async () => {
    const { store, user } = renderEarnMenuBottomSheet([
      {
        icon: "Plus",
        label: "Stake",
        metadata: { button: "stake", live_app: "earn", flow: "stake", link: "https://earn.app" },
      },
    ]);

    await user.press(screen.getByTestId("close-bottom-sheet"));

    expect(store.getState().earn.menuBottomSheet).toBeUndefined();
  });

  it("should track analytics and navigate to Earn screen when pressing an earn live_app option", async () => {
    const { user } = renderEarnMenuBottomSheet([
      {
        icon: "Plus",
        label: "Stake",
        metadata: {
          button: "stake",
          live_app: "earn",
          flow: "stake",
          link: "?intent=deposit&accountId=acc123",
        },
      },
    ]);

    await user.press(screen.getByText("Stake"));

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "stake",
      flow: "stake",
      live_app: "earn",
    });

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Base, {
      screen: NavigatorName.Earn,
      params: {
        screen: ScreenName.Earn,
        ...mockRouteParams,
        platform: "earn",
        params: {
          intent: "deposit",
          accountId: "acc123",
        },
      },
    });
  });

  it("should navigate with withdraw intent when link contains intent=withdraw", async () => {
    const { user } = renderEarnMenuBottomSheet([
      {
        icon: "ArrowDown",
        label: "Withdraw",
        metadata: {
          button: "withdraw",
          live_app: "earn-stg",
          flow: "withdraw",
          link: "?intent=withdraw&accountId=acc456",
        },
      },
    ]);

    await user.press(screen.getByText("Withdraw"));

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Base, {
      screen: NavigatorName.Earn,
      params: {
        screen: ScreenName.Earn,
        ...mockRouteParams,
        platform: "earn",
        params: {
          intent: "withdraw",
          accountId: "acc456",
        },
      },
    });
  });

  it("should set intent to undefined when intent is invalid for earn live_app", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    const { user } = renderEarnMenuBottomSheet([
      {
        icon: "Plus",
        label: "Bad Intent",
        metadata: {
          button: "btn",
          live_app: "earn-prd-eks",
          flow: "f",
          link: "?intent=invalid&accountId=acc789",
        },
      },
    ]);

    await user.press(screen.getByText("Bad Intent"));

    expect(warnSpy).toHaveBeenCalledWith(
      'Invalid earn flow intent: invalid. Expected "deposit" or "withdraw".',
    );

    expect(mockNavigate).toHaveBeenCalledWith(
      NavigatorName.Base,
      expect.objectContaining({
        params: expect.objectContaining({
          params: expect.objectContaining({
            intent: undefined,
          }),
        }),
      }),
    );

    warnSpy.mockRestore();
  });

  it("should open external URL when live_app is not a valid earn manifest id", async () => {
    const { user } = renderEarnMenuBottomSheet([
      {
        icon: "ExternalLink",
        label: "External",
        metadata: {
          button: "external",
          live_app: "other-app",
          flow: "external",
          link: "https://external.example.com",
        },
      },
    ]);

    await user.press(screen.getByText("External"));

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "external",
      flow: "external",
      live_app: "other-app",
    });

    expect(Linking.openURL).toHaveBeenCalledWith("https://external.example.com");
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("should close bottom sheet after pressing an option", async () => {
    const { store, user } = renderEarnMenuBottomSheet([
      {
        icon: "Plus",
        label: "Stake",
        metadata: {
          button: "stake",
          live_app: "earn",
          flow: "stake",
          link: "?intent=deposit&accountId=acc123",
        },
      },
    ]);

    await user.press(screen.getByText("Stake"));

    expect(store.getState().earn.menuBottomSheet).toBeUndefined();
  });

  it("should not include link and live_app in tracked metadata", async () => {
    const { user } = renderEarnMenuBottomSheet([
      {
        icon: "Plus",
        label: "Track Test",
        metadata: {
          button: "btn",
          live_app: "other",
          flow: "f",
          link: "https://example.com",
        },
      },
    ]);

    await user.press(screen.getByText("Track Test"));

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "btn",
      flow: "f",
      live_app: "other",
    });
  });
});

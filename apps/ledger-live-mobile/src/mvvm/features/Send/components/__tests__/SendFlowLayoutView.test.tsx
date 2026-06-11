import React from "react";
import { Text, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { render, screen } from "@testing-library/react-native";

import { SendFlowLayoutView } from "../SendFlowLayoutView";

jest.mock("react-native-safe-area-context", () => {
  const RN = jest.requireActual<typeof import("react-native")>("react-native");

  return {
    SafeAreaView: ({
      children,
      style,
    }: {
      children: React.ReactNode;
      style?: StyleProp<ViewStyle>;
    }) => <RN.View style={style}>{children}</RN.View>,
    useSafeAreaInsets: () => ({
      top: 0,
      bottom: 10,
      left: 0,
      right: 0,
    }),
  };
});

jest.mock("@ledgerhq/lumen-ui-rnative", () => {
  return {
    BottomSheetModalProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

jest.mock("../SendHeader", () => {
  const RN = jest.requireActual<typeof import("react-native")>("react-native");

  return {
    SendHeader: ({ headerRight }: { headerRight?: React.ReactNode }) => (
      <RN.View testID="send-header">{headerRight}</RN.View>
    ),
  };
});

jest.mock("@ledgerhq/lumen-ui-rnative/styles", () => ({
  useStyleSheet: (
    createStyles: (theme: {
      colors: { bg: { base: string } };
      spacings: Record<"s12" | "s16" | "s24", number>;
    }) => unknown,
  ) =>
    createStyles({
      colors: { bg: { base: "#ffffff" } },
      spacings: { s12: 12, s16: 16, s24: 24 },
    }),
}));

describe("SendFlowLayoutView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the page layout with header content and body", () => {
    render(
      <SendFlowLayoutView headerContent={<Text>Header content</Text>}>
        <View testID="page-content" />
      </SendFlowLayoutView>,
    );

    expect(screen.getByTestId("send-header")).toBeOnTheScreen();
    expect(screen.getByText("Header content")).toBeOnTheScreen();
    expect(screen.getByTestId("page-content")).toBeOnTheScreen();
  });

  it("should render headerRight inside the send header", () => {
    render(
      <SendFlowLayoutView headerRight={<Text>Right action</Text>}>
        <View testID="page-content" />
      </SendFlowLayoutView>,
    );

    expect(screen.getByText("Right action")).toBeOnTheScreen();
  });
});

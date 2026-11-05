import React, { useMemo } from "react";
import { Text } from "react-native";
import { Stax } from "@ledgerhq/lumen-ui-rnative/symbols";
import { renderWithReactQuery } from "@tests/test-renderer";
import { CustomTopBar, type TopBarActionIcon } from "./index";

jest.mock("@ledgerhq/lumen-ui-rnative/symbols", () => {
  const makeIcon = (testID: string) => () => <Text testID={testID}>{testID}</Text>;

  return {
    Stax: makeIcon("device-icon-stax"),
  };
});

const mockOnLeadingPress = jest.fn();
const mockOnCustomActionPress = jest.fn();

const CustomIcon: TopBarActionIcon["icon"] = ({ size, style }) => (
  <Stax size={size} style={style} color="base" />
);

const leadingIcon: TopBarActionIcon = {
  id: "leading",
  icon: CustomIcon,
  callback: mockOnLeadingPress,
  testID: "topbar-leading",
  accessibilityLabel: "Leading",
};

const emptyTrailing: readonly TopBarActionIcon[] = [];

function TopBarHarness({
  trailingIcons,
  extraLeadingIcons = emptyTrailing,
}: Readonly<{
  trailingIcons: readonly TopBarActionIcon[];
  extraLeadingIcons?: readonly TopBarActionIcon[];
}>) {
  const leadingIcons = useMemo(() => [leadingIcon, ...extraLeadingIcons], [extraLeadingIcons]);
  return <CustomTopBar leadingIcons={leadingIcons} trailingIcons={trailingIcons} />;
}

describe("CustomTopBar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call expected callbacks when leading and trailing action buttons are pressed", async () => {
    const trailingIcons: readonly TopBarActionIcon[] = [
      {
        id: "custom-settings",
        icon: CustomIcon,
        callback: mockOnCustomActionPress,
        testID: "topbar-custom-settings",
        accessibilityLabel: "Settings",
      },
    ];

    const { user, getByTestId } = renderWithReactQuery(
      <TopBarHarness trailingIcons={trailingIcons} />,
    );

    await user.press(getByTestId("topbar-leading"));
    await user.press(getByTestId("topbar-custom-settings"));

    expect(mockOnLeadingPress).toHaveBeenCalledTimes(1);
    expect(mockOnCustomActionPress).toHaveBeenCalledTimes(1);
  });

  it("should render only the leading button when no trailing icons are provided", async () => {
    const { user, getByTestId, queryByTestId } = renderWithReactQuery(
      <TopBarHarness trailingIcons={[]} />,
    );

    await user.press(getByTestId("topbar-leading"));

    expect(mockOnLeadingPress).toHaveBeenCalledTimes(1);
    expect(queryByTestId("topbar-custom-settings")).toBeNull();
  });

  it("should render extra leading icons after the first leading icon", async () => {
    const onExtraPress = jest.fn();
    const extraLeadingIcons: readonly TopBarActionIcon[] = [
      {
        id: "leading-discover",
        icon: CustomIcon,
        callback: onExtraPress,
        testID: "topbar-extra-leading",
        accessibilityLabel: "Discover",
      },
    ];

    const { user, getByTestId } = renderWithReactQuery(
      <TopBarHarness trailingIcons={[]} extraLeadingIcons={extraLeadingIcons} />,
    );

    await user.press(getByTestId("topbar-extra-leading"));

    expect(onExtraPress).toHaveBeenCalledTimes(1);
  });

  it("should call the matching callback for each trailing icon", async () => {
    const onFirstPress = jest.fn();
    const onSecondPress = jest.fn();

    const trailingIcons: readonly TopBarActionIcon[] = [
      {
        id: "custom-first",
        icon: CustomIcon,
        callback: onFirstPress,
        testID: "topbar-custom-first",
        accessibilityLabel: "First custom action",
      },
      {
        id: "custom-second",
        icon: CustomIcon,
        callback: onSecondPress,
        testID: "topbar-custom-second",
        accessibilityLabel: "Second custom action",
      },
    ];

    const { user, getByTestId } = renderWithReactQuery(
      <TopBarHarness trailingIcons={trailingIcons} />,
    );

    await user.press(getByTestId("topbar-custom-first"));
    await user.press(getByTestId("topbar-custom-second"));

    expect(onFirstPress).toHaveBeenCalledTimes(1);
    expect(onSecondPress).toHaveBeenCalledTimes(1);
  });
});

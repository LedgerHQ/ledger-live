import React from "react";
import { Text } from "react-native";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { Stax } from "@ledgerhq/lumen-ui-rnative/symbols";
import { renderWithReactQuery } from "@tests/test-renderer";
import { State } from "~/reducers/types";
import { CustomTopBar, TopBarActionIcon } from "./index";

jest.mock("@ledgerhq/lumen-ui-rnative/symbols", () => {
  const makeIcon = (testID: string) => () => <Text testID={testID}>{testID}</Text>;

  return {
    Nano: makeIcon("device-icon-nano"),
    Flex: makeIcon("device-icon-flex"),
    Apex: makeIcon("device-icon-apex"),
    Stax: makeIcon("device-icon-stax"),
  };
});

const mockOnMyLedgerPress = jest.fn();
const mockOnCustomActionPress = jest.fn();

const CustomIcon: TopBarActionIcon["icon"] = ({ size, style }) => (
  <Stax size={size} style={style} color="base" />
);

const createLastConnectedDevice = (
  modelId: DeviceModelId,
): NonNullable<State["settings"]["lastConnectedDevice"]> => ({
  deviceId: "test-device-id",
  modelId,
  wired: true,
});

const withLastConnectedDevice =
  (modelId: DeviceModelId) =>
  (state: State): State => ({
    ...state,
    settings: {
      ...state.settings,
      lastConnectedDevice: createLastConnectedDevice(modelId),
    },
  });

describe("CustomTopBar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call expected callbacks when myLedger and custom action buttons are pressed", async () => {
    const customIcons: readonly TopBarActionIcon[] = [
      {
        id: "custom-settings",
        icon: CustomIcon,
        callback: mockOnCustomActionPress,
        testID: "topbar-custom-settings",
        accessibilityLabel: "Settings",
      },
    ];

    const { user, getByTestId } = renderWithReactQuery(
      <CustomTopBar onMyLedgerPress={mockOnMyLedgerPress} customIcons={customIcons} />,
      {
        overrideInitialState: withLastConnectedDevice(DeviceModelId.stax),
      },
    );

    await user.press(getByTestId("topbar-myledger"));
    await user.press(getByTestId("topbar-custom-settings"));

    expect(mockOnMyLedgerPress).toHaveBeenCalledTimes(1);
    expect(mockOnCustomActionPress).toHaveBeenCalledTimes(1);
  });

  it("should render only my ledger button when no custom icons are provided", async () => {
    const { user, getByTestId, queryByTestId } = renderWithReactQuery(
      <CustomTopBar onMyLedgerPress={mockOnMyLedgerPress} customIcons={[]} />,
      {
        overrideInitialState: withLastConnectedDevice(DeviceModelId.stax),
      },
    );

    await user.press(getByTestId("topbar-myledger"));

    expect(mockOnMyLedgerPress).toHaveBeenCalledTimes(1);
    expect(queryByTestId("topbar-custom-settings")).toBeNull();
  });

  it("should call the matching callback for each custom icon", async () => {
    const onFirstPress = jest.fn();
    const onSecondPress = jest.fn();

    const customIcons: readonly TopBarActionIcon[] = [
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
      <CustomTopBar onMyLedgerPress={mockOnMyLedgerPress} customIcons={customIcons} />,
      {
        overrideInitialState: withLastConnectedDevice(DeviceModelId.stax),
      },
    );

    await user.press(getByTestId("topbar-custom-first"));
    await user.press(getByTestId("topbar-custom-second"));

    expect(onFirstPress).toHaveBeenCalledTimes(1);
    expect(onSecondPress).toHaveBeenCalledTimes(1);
  });

  it.each([
    [DeviceModelId.nanoS, "device-icon-nano"],
    [DeviceModelId.nanoSP, "device-icon-nano"],
    [DeviceModelId.nanoX, "device-icon-nano"],
    [DeviceModelId.europa, "device-icon-flex"],
    [DeviceModelId.apex, "device-icon-apex"],
    [DeviceModelId.stax, "device-icon-stax"],
  ])("should render %s icon for model %s", (modelId, expectedIconTestId) => {
    const { getByTestId } = renderWithReactQuery(
      <CustomTopBar onMyLedgerPress={mockOnMyLedgerPress} customIcons={[]} />,
      {
        overrideInitialState: withLastConnectedDevice(modelId),
      },
    );

    expect(getByTestId(expectedIconTestId)).toBeTruthy();
  });

  it("should fallback to stax icon when no device is connected", () => {
    const { getByTestId } = renderWithReactQuery(
      <CustomTopBar onMyLedgerPress={mockOnMyLedgerPress} customIcons={[]} />,
    );

    expect(getByTestId("device-icon-stax")).toBeTruthy();
  });
});

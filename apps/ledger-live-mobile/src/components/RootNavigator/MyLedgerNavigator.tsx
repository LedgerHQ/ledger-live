import React, { useMemo } from "react";
import { TouchableOpacity } from "react-native";
import styled, { useTheme } from "styled-components/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSelector } from "~/context/hooks";
import { Box, IconsLegacy, Flex, Icons } from "@ledgerhq/native-ui";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { ScreenName } from "~/const";
import { hasAvailableUpdateSelector, lastSeenDeviceSelector } from "~/reducers/settings";
import MyLedgerChooseDeviceScreen, { headerOptions } from "~/screens/MyLedgerChooseDevice";
import MyLedgerDeviceScreen from "~/screens/MyLedgerDevice";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import TabIcon from "../TabIcon";
import { useIsNavLocked } from "./CustomBlockRouterNavigator";
import { MyLedgerNavigatorStackParamList } from "./types/MyLedgerNavigator";
import { Nano, Stax } from "@ledgerhq/lumen-ui-rnative/symbols";
import { Apex } from "@ledgerhq/lumen-ui-rnative/symbols";

const BadgeContainer = styled(Flex).attrs({
  position: "absolute",
  top: -1,
  right: -1,
  width: 14,
  height: 14,
  borderRadius: 7,
  borderWidth: 3,
})``;

const Badge = () => {
  const { colors } = useTheme();
  return (
    <BadgeContainer
      style={{
        backgroundColor: colors.constant.purple,
        borderColor: colors.background.main,
      }}
    />
  );
};

export default function MyLedgerNavigator() {
  const { colors } = useTheme();
  const stackNavConfig = useMemo(() => getStackNavigatorConfig(colors), [colors]);

  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavConfig,
      }}
    >
      <Stack.Screen
        name={ScreenName.MyLedgerChooseDevice}
        component={MyLedgerChooseDeviceScreen}
        options={{
          ...headerOptions,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.MyLedgerDevice}
        component={MyLedgerDeviceScreen}
        options={{ title: "" }}
      />
    </Stack.Navigator>
  );
}

const Stack = createNativeStackNavigator<MyLedgerNavigatorStackParamList>();

const DeviceIcon = ({ color, size = 16 }: { color?: string; size?: number }) => {
  const hasAvailableUpdate = useSelector(hasAvailableUpdateSelector);
  const lastSeenDevice = useSelector(lastSeenDeviceSelector);

  let icon;
  switch (lastSeenDevice?.modelId) {
    case DeviceModelId.stax:
      icon = <Stax size="M" color={color} />;
      break;
    case DeviceModelId.europa:
      icon = <Flex size="M" color={color} />;
      break;
    case DeviceModelId.apex:
      icon = <Apex size="M" color={color} />;
      break;
    case DeviceModelId.nanoS:
    case DeviceModelId.nanoSP:
      icon = <Nano size={size} color={color} />;
      break;
    case DeviceModelId.nanoX:
    default:
      icon = <Nano size={size} color={color} />;
      break;
  }

  return hasAvailableUpdate ? (
    <Box>
      {icon}
      <Badge />
    </Box>
  ) : (
    icon
  );
};

export function ManagerTabIcon(
  props: Omit<React.ComponentProps<typeof TabIcon>, "Icon" | "i18nKey">,
) {
  const isNavLocked = useIsNavLocked();

  const content = <TabIcon {...props} Icon={DeviceIcon} i18nKey="tabs.manager" />;

  if (isNavLocked) {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    return <TouchableOpacity onPress={() => { }}>{content}</TouchableOpacity>;
  }

  return content;
}

import React, { useMemo } from "react";
import { TouchableOpacity } from "react-native";
import styled, { useTheme } from "styled-components/native";
import { createStackNavigator } from "@react-navigation/stack";
import { useSelector } from "react-redux";
import { Box, Icons, Flex } from "@ledgerhq/native-ui";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { ScreenName } from "../../const";
import {
  hasAvailableUpdateSelector,
  lastSeenDeviceSelector,
} from "../../reducers/settings";
import Manager from "../../screens/Manager";
import ManagerMain from "../../screens/Manager/Manager";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";
import styles from "../../navigation/styles";
import TabIcon from "../TabIcon";
import { useIsNavLocked } from "./CustomBlockRouterNavigator";
import { ManagerNavigatorStackParamList } from "./types/ManagerNavigator";

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

export default function ManagerNavigator() {
  const { colors } = useTheme();
  const stackNavConfig = useMemo(
    () => getStackNavigatorConfig(colors),
    [colors],
  );

  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavConfig,
        headerStyle: {
          ...styles.header,
          backgroundColor: colors.background.main,
          borderBottomColor: colors.background.main,
        },
      }}
    >
      <Stack.Screen
        name={ScreenName.Manager}
        component={Manager}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.ManagerMain}
        component={ManagerMain}
        options={{ title: "" }}
      />
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator<ManagerNavigatorStackParamList>();

const DeviceIcon = ({
  color,
  size = 16,
}: {
  color?: string;
  size?: number;
}) => {
  const hasAvailableUpdate = useSelector(hasAvailableUpdateSelector);
  const lastSeenDevice = useSelector(lastSeenDeviceSelector);

  let icon;
  switch (lastSeenDevice?.modelId) {
    case DeviceModelId.nanoS:
    case DeviceModelId.nanoSP:
      icon = <Icons.NanoSFoldedMedium size={size} color={color} />;
      break;
    case DeviceModelId.nanoFTS:
      icon = <Icons.PowerMedium size={size} color={color} />;
      break;
    case DeviceModelId.nanoX:
    default:
      icon = <Icons.NanoXFoldedMedium size={size} color={color} />;
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

  const content = (
    <TabIcon {...props} Icon={DeviceIcon} i18nKey="tabs.manager" />
  );

  if (isNavLocked) {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    return <TouchableOpacity onPress={() => {}}>{content}</TouchableOpacity>;
  }

  return content;
}

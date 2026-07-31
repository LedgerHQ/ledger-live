import {
  createNativeStackNavigator,
  type NativeStackNavigationOptions,
} from "@react-navigation/native-stack";
import { BottomSheetModalProvider } from "@ledgerhq/lumen-ui-rnative";
import { type DevToolsBaseProps } from "./DevTools.types";
import { DevToolsProvider, DevToolsShellProvider } from "../context";
import { useDevToolsViewModel } from "./useDevToolsViewModel";
import { CategoriesScreen } from "./screens/CategoriesScreen";
import { ToolsScreen } from "./screens/ToolsScreen";
import { ToolScreen } from "./screens/ToolScreen";
import type { DevToolsParamList } from "./navigation";

export interface DevToolsProps extends DevToolsBaseProps {
  readonly screenOptions?: NativeStackNavigationOptions;
}

const Stack = createNativeStackNavigator<DevToolsParamList>();

export function DevTools({ config = [], footer, screenOptions }: DevToolsProps) {
  const { shell } = useDevToolsViewModel({ config, footer });

  return (
    <BottomSheetModalProvider>
      <DevToolsProvider value={config}>
        <DevToolsShellProvider value={shell}>
          <Stack.Navigator screenOptions={screenOptions}>
            <Stack.Screen name="categories" component={CategoriesScreen} />
            <Stack.Screen name="tools" component={ToolsScreen} />
            <Stack.Screen name="tool" component={ToolScreen} />
          </Stack.Navigator>
        </DevToolsShellProvider>
      </DevToolsProvider>
    </BottomSheetModalProvider>
  );
}

export default DevTools;

import {
  createNativeStackNavigator,
  type NativeStackNavigationOptions,
} from "@react-navigation/native-stack";
import { type DevToolsConfig } from "@devtools/registry";
import { DevToolsProvider, DevToolsShellProvider } from "../context";
import { useDevToolsViewModel } from "./useDevToolsViewModel.native";
import { CategoriesScreen } from "./screens/CategoriesScreen.native";
import { ToolsScreen } from "./screens/ToolsScreen.native";
import { ToolScreen } from "./screens/ToolScreen.native";
import type { DevToolsParamList } from "./navigation.native";

export interface DevToolsProps {
  readonly config?: DevToolsConfig;
  readonly screenOptions?: NativeStackNavigationOptions;
}

const Stack = createNativeStackNavigator<DevToolsParamList>();

export function DevTools({ config = [], screenOptions }: DevToolsProps) {
  const { shell } = useDevToolsViewModel({ config });

  return (
    <DevToolsProvider value={config}>
      <DevToolsShellProvider value={shell}>
        <Stack.Navigator screenOptions={screenOptions}>
          <Stack.Screen name="categories" component={CategoriesScreen} />
          <Stack.Screen name="tools" component={ToolsScreen} />
          <Stack.Screen name="tool" component={ToolScreen} />
        </Stack.Navigator>
      </DevToolsShellProvider>
    </DevToolsProvider>
  );
}

export default DevTools;

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { MainNavigatorParamList } from "../types/MainNavigator";

export const Tab = createBottomTabNavigator<MainNavigatorParamList>();

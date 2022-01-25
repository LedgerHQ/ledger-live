// @ts-expect-error react native import
import { NativeModules } from "react-native";
export const getNativeModule = (name: string): any =>
  NativeModules[`Core${name}`];

// @flow

import { NativeModules } from "react-native";

export const getNativeModule = (name: string) => NativeModules[`CoreLG${name}`];

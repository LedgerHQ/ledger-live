import { createContext } from "react";
import { SharedValue } from "react-native-reanimated";

export type HeaderContextType = {
  layoutY?: SharedValue<number>;
};

export const HeaderContext = createContext<HeaderContextType>({});

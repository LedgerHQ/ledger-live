import { createContext } from "react";
import { SharedValue } from "react-native-reanimated";

export type HeaderContextType = {
  layoutY?: SharedValue<number>;
  search?: string;
};

export const HeaderContext = createContext<HeaderContextType>({});

import { Dimensions } from "react-native";

export default () => {
  const { width, height } = Dimensions.get("window");
  return {
    width,
    height,
  };
};
export const softMenuBarHeight = () => 0;

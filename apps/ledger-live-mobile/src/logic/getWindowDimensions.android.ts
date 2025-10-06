import { Dimensions } from "react-native";

export default () => {
  const screen = Dimensions.get("screen");
  return {
    width: screen.width,
    height: screen.height,
  };
};

import { useWindowDimensions, Platform } from "react-native";

const useSystem = () => {
  // Device dimensions
  const { width, height } = useWindowDimensions();

  // Device informations
  const os = Platform.OS;
  const version = Platform.Version;

  return {
    device: { os, version },
    screen: { width, height },
  };
};

export default useSystem;

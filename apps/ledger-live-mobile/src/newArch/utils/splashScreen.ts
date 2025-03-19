import SplashScreen from "react-native-splash-screen";
import { NativeModules, Platform } from "react-native";

export function showSplashScreen() {
  if (Platform.OS === "ios") {
    const { RNSplashScreenModule } = NativeModules;
    RNSplashScreenModule.showSplashScreen();
  } else SplashScreen.show();
}

export function dismissSplashScreen() {
  if (Platform.OS === "ios") {
    const { RNSplashScreenModule } = NativeModules;
    RNSplashScreenModule.hideSplashScreen();
  } else setTimeout(() => SplashScreen.hide(), 300);
}

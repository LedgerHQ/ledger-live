import SplashScreen from "react-native-splash-screen";
import { NativeModules, Platform } from "react-native";

export async function showSplashScreen(): Promise<void> {
  if (Platform.OS === "ios") {
    const { RNSplashScreenModule } = NativeModules;
    await RNSplashScreenModule.showSplashScreen();
  } else {
    await SplashScreen.show();
  }
}

export async function dismissSplashScreen(): Promise<void> {
  if (Platform.OS === "ios") {
    const { RNSplashScreenModule } = NativeModules;
    await RNSplashScreenModule.hideSplashScreen();
  } else {
    await new Promise(resolve => setTimeout(resolve, 300));
    await SplashScreen.hide();
  }
}

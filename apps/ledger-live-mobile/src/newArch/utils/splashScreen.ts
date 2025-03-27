import SplashScreen from "react-native-splash-screen";
import { NativeModules, Platform } from "react-native";

type RNModuleSplashScreenType = {
  showSplashScreen: () => Promise<void>;
  hideSplashScreen: () => Promise<void>;
};

const splashScreenModule: RNModuleSplashScreenType = NativeModules.RNSplashScreenModule;

export async function showSplashScreen(): Promise<void> {
  if (Platform.OS === "ios") {
    setTimeout(async () => await splashScreenModule.showSplashScreen(), 100);
  } else {
    await SplashScreen.show();
  }
}

export async function dismissSplashScreen(): Promise<void> {
  if (Platform.OS === "ios") {
    await splashScreenModule.hideSplashScreen();
  } else {
    await new Promise(resolve => setTimeout(resolve, 300));
    await SplashScreen.hide();
  }
}

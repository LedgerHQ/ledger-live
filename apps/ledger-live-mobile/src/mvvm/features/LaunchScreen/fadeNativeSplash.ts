import SplashScreen from "react-native-splash-screen";

let faded = false;

export function fadeNativeSplash(): boolean {
  if (faded) return false;
  faded = true;
  SplashScreen.hide();
  return true;
}

export function resetNativeSplashFade(): void {
  faded = false;
}

declare module "react-native-android-location-services-dialog-box" {
  type Options = {
    message?: string;
    ok?: string;
    cancel?: string;
    enableHighAccuracy?: boolean; // true => GPS AND NETWORK PROVIDER, false => GPS OR NETWORK PROVIDER
    showDialog?: boolean; // false => Opens the Location access page directly
    openLocationServices?: boolean; // false => Directly catch method is called if location services are turned off
    preventOutSideTouch?: boolean; // true => To prevent the location services window from closing when it is clicked outside
    preventBackClick?: boolean; // true => To prevent the location services popup from closing when it is clicked back button
    providerListener?: boolean; // true ==> Trigger locationProviderStatusChange listener when the location state changes
    style?: object;
  };

  type Success = {
    alreadyEnabled: boolean;
    enabled: boolean;
    status: string;
  };

  declare function checkLocationServicesIsEnabled(args: Options): Promise<Success>;

  declare function forceCloseDialog(): void;
  declare function stopListener(): void;
}

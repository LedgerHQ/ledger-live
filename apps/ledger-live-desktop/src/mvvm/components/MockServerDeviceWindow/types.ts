export type MockServerDeviceWindowViewModel =
  | { readonly isVisible: false }
  | {
      readonly isVisible: true;
      readonly url: string;
      readonly token: string;
      readonly deviceId: string;
    };

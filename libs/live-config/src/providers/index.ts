export type SupportedProviders = "firebaseRemoteConfig";

export declare interface Provider {
  name: SupportedProviders;
  value: unknown;
}

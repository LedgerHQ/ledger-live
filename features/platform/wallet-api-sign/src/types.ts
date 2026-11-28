export type WalletApiDeviceIntentSignFlagId =
  | "llmWalletApiDeviceIntentSign"
  | "lldWalletApiDeviceIntentSign";

export type DeviceIntentSignAssignment = Readonly<{
  enabled: boolean;
  variantId: string | undefined;
  active: boolean;
}>;

export type WalletApiTermsSources = Readonly<{
  dexProvidersContractAddress: Readonly<Record<string, string>>;
  termsOfUse: Readonly<Record<string, string>>;
  privacyPolicy: Readonly<Record<string, string>>;
}>;

export type ResolveWalletApiTermsParams = Readonly<{
  manifestId: string;
  manifestName?: string;
  recipient?: string;
  sources: WalletApiTermsSources;
}>;

export type WalletApiResolvedTerms = Readonly<{
  appName: string;
  termsOfUseUrl: string;
  privacyUrl: string | undefined;
}>;

export type PreparedDeviceIntentSignRequest<InitInput, IntentInput> = Readonly<{
  deviceInitializationInput: InitInput;
  intentInput: IntentInput;
}>;

/** The executor error screen the user closed, as the app's executor wrapper reports it. */
export type DeviceIntentSignFailure = Readonly<{
  failureType: string;
  countsAsFailure: boolean;
  subError?: string;
}>;

export type WalletApiSignatureSourceFlow = "wallet_api" | "wallet_connect";

export type WalletApiSignatureQueueItem<TransactionRequest, MessageRequest> =
  | Readonly<{ id: number; type: "transaction"; request: TransactionRequest }>
  | Readonly<{ id: number; type: "message"; request: MessageRequest }>;

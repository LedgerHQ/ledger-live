export type AppProtectionRequest = Readonly<{
  reason?: string;
  successReason?: string;
}>;

export type AppProtectionPrompt = Readonly<{
  requestProtection: (request?: AppProtectionRequest) => Promise<boolean>;
}>;

export type AppProtectionPromptState = AppProtectionPrompt &
  Readonly<{
    request: AppProtectionRequest | null;
    settle: (isProtectionGranted: boolean) => void;
  }>;

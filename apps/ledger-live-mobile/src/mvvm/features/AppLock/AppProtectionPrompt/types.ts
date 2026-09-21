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
    /**
     * `forRequest` names the request being answered, so a sheet finishing its exit after a second
     * caller has taken over cannot answer for them. Omit it to answer whatever is pending.
     */
    settle: (isProtectionGranted: boolean, forRequest?: AppProtectionRequest | null) => void;
  }>;

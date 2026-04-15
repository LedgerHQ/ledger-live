export type BaanxUserProfile = Record<string, unknown>;

export type OAuthSession = {
  jwtToken: string;
  codeVerifier: string;
  state: string;
};

export type OAuthTokens = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

export type OAuthStep =
  | "initiating"
  | "logging-in"
  | "authorizing"
  | "exchanging"
  | "fetching-profile";

export type BaanxSandboxState =
  | { kind: "idle" }
  | { kind: "in-progress"; step: OAuthStep }
  | { kind: "authenticated"; profile: BaanxUserProfile }
  | { kind: "error"; message: string };

export type BaanxSandboxViewModel = {
  state: BaanxSandboxState;
  email: string;
  password: string;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  login: () => void;
  logout: () => void;
  navigateBack: () => void;
};

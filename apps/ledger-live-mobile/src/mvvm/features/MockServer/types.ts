export type MockServerStatus = "checking" | "connected" | "unreachable" | "sessionExpired";

export type MockServerConnection = {
  url: string;
  token: string;
};

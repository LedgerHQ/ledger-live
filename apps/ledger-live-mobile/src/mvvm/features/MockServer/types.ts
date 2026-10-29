import type { MockServerStatus as MockServerConnectionStatus } from "@ledgerhq/live-dmk-shared";

export type MockServerStatus = "checking" | MockServerConnectionStatus;

export type MockServerConnection = {
  url: string;
  token: string;
};

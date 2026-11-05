import type { MockServerConfig } from "./mockServerApi";

export type MockServerSettings = Readonly<{
  enabled: boolean;
  url: string;
  token: string;
}>;

export const getMockServerConfig = ({
  enabled,
  url,
  token,
}: MockServerSettings): MockServerConfig | null =>
  enabled && url && token ? { url, token } : null;

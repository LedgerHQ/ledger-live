import type { DevToolsConfig } from "@devtools/registry";

// Test-only escape hatch: DevToolsConfig is a strict discriminated union over
// real registered tool IDs. Tests that mock the registry with fake IDs need
// to bypass that typing.
export const mockDevToolsConfig = (items: Array<{ id: string; config: unknown }>): DevToolsConfig =>
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  items as unknown as DevToolsConfig;

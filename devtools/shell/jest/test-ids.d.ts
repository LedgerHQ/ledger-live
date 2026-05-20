export {};

declare module "@devtools/core" {
  interface DevToolsPropsRegistry {
    "test-tool"?: { value: string };
    "optional-tool"?: { value?: string };
    dup?: Record<string, never>;
    "web-tool"?: Record<string, never>;
    "native-tool"?: Record<string, never>;
    "shared-tool"?: Record<string, never>;
    "feature-flags"?: Record<string, never>;
    "another-tool"?: Record<string, never>;
    other?: Record<string, never>;
    "env-switcher"?: Record<string, never>;
    "network-inspector"?: Record<string, never>;
  }
}

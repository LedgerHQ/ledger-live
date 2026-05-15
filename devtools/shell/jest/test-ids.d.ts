export {};

declare module "../src/index" {
  interface DevToolsPropsRegistry {
    "test-tool"?: { value: string };
    "optional-tool"?: { value?: string };
    dup?: Record<string, never>;
    "web-tool"?: Record<string, never>;
    "native-tool"?: Record<string, never>;
    "shared-tool"?: Record<string, never>;
  }
}

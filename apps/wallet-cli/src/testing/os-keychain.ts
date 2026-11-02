// What the Linux Secret Service probe throws on a host with no provider reachable.
export function failingKeychainProbe(): never {
  throw new Error(
    "Platform failure: DBus error: The name org.freedesktop.secrets was not provided by any " +
      ".service files",
  );
}

// The Secret Service probe only runs on Linux, so tests fake the platform. Returns the restore.
export function overridePlatform(platform: NodeJS.Platform): () => void {
  const realPlatform = Object.getOwnPropertyDescriptor(process, "platform")!;
  Object.defineProperty(process, "platform", { value: platform });
  return () => Object.defineProperty(process, "platform", realPlatform);
}

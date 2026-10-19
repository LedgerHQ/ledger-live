// What the Linux Secret Service probe throws on a host with no provider reachable.
export function failingKeychainProbe(): never {
  throw new Error("no secret service provider or dbus session found");
}

// The Secret Service probe only runs on Linux, so tests fake the platform. Returns the restore.
export function overridePlatform(platform: NodeJS.Platform): () => void {
  const realPlatform = Object.getOwnPropertyDescriptor(process, "platform")!;
  Object.defineProperty(process, "platform", { value: platform });
  return () => Object.defineProperty(process, "platform", realPlatform);
}

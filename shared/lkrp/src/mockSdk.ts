import {
  InMemoryCrypto,
  InMemoryKeyStore,
  InMemoryTrustchainBackend,
  NoopDeviceLayer,
} from "./internals/inMemoryAdapters";
import type { LkrpSdkDependencies } from "./ports";
import { LkrpSdk } from "./sdk";

export function createMockLkrpSdk(overrides: Partial<LkrpSdkDependencies> = {}): LkrpSdk {
  return new LkrpSdk({
    crypto: overrides.crypto ?? new InMemoryCrypto(),
    backend: overrides.backend ?? new InMemoryTrustchainBackend(),
    keyStore: overrides.keyStore ?? new InMemoryKeyStore(),
    device: "device" in overrides ? overrides.device : new NoopDeviceLayer(),
  });
}

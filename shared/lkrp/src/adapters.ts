import { LkrpNotImplementedError } from "./errors";
import type {
  LkrpCommandStreamCodec,
  LkrpDeviceLayer,
  TrustchainBackend,
  TrustchainHttpBackendConfig,
} from "./ports";
import type { LkrpStream } from "./types";

function unimplemented<T>(operation: string): Promise<T> {
  return Promise.reject(new LkrpNotImplementedError(operation));
}

export function createTrustchainHttpBackend(
  _config: TrustchainHttpBackendConfig,
): TrustchainBackend {
  return {
    list: () => unimplemented("TrustchainBackend.list"),
    read: () => unimplemented("TrustchainBackend.read"),
    create: () => unimplemented("TrustchainBackend.create"),
    append: () => unimplemented("TrustchainBackend.append"),
    remove: () => unimplemented("TrustchainBackend.remove"),
  };
}

export function createCommandStreamCodec(): LkrpCommandStreamCodec {
  return {
    encode(_stream: LkrpStream): Uint8Array {
      throw new LkrpNotImplementedError("LkrpCommandStreamCodec.encode");
    },
    decode(_bytes: Uint8Array): LkrpStream {
      throw new LkrpNotImplementedError("LkrpCommandStreamCodec.decode");
    },
  };
}

export function createSoftwareDeviceLayer(): LkrpDeviceLayer {
  return {
    execute: () => unimplemented("LkrpDeviceLayer.execute"),
  };
}

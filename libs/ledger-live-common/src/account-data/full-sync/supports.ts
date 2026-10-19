import { currencyIdFromNetwork, type AccountDescriptor } from "@domain/entity-account-descriptor";

/** Whether the descriptor's network is a crypto currency the legacy bridges know. */
export function isFullSyncSupported(descriptor: AccountDescriptor): boolean {
  try {
    currencyIdFromNetwork(descriptor.network);
    return true;
  } catch {
    return false;
  }
}

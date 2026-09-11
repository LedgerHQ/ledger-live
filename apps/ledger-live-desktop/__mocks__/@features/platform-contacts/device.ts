import { createMockContactDeviceIntentsPort } from "@features/platform-contacts/test";

const deviceIntents = createMockContactDeviceIntentsPort();

export function useContactsIntentsOrchestrator() {
  return { deviceIntents, dieProps: undefined };
}

import { createMockContactDeviceIntentsPort } from "@features/platform-contacts";

const deviceIntents = createMockContactDeviceIntentsPort();

export function useContactsIntentsOrchestrator() {
  return { deviceIntents, dieProps: undefined };
}

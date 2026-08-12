import type { TransportProtocol } from "@devtools/transport";
import { z } from "zod";

export const DeviceSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export type Device = z.infer<typeof DeviceSchema>;

export const RetrieveConnectedDevicesSchemas = {
  "RetrieveConnectedDevicesMessages:devices": z.array(DeviceSchema),
} as const;

export type RetrieveConnectedDevicesMessages = {
  [K in keyof typeof RetrieveConnectedDevicesSchemas]: z.infer<
    (typeof RetrieveConnectedDevicesSchemas)[K]
  >;
};

export interface RetrieveConnectedDevicesOptions {
  setDevices: (devices: Device[]) => void;
}

export function createRetrieveConnectedDevicesProtocol({
  setDevices,
}: RetrieveConnectedDevicesOptions): TransportProtocol<RetrieveConnectedDevicesMessages> {
  return {
    onReceive(kind, payload) {
      switch (kind) {
        case "RetrieveConnectedDevicesMessages:devices": {
          const result =
            RetrieveConnectedDevicesSchemas["RetrieveConnectedDevicesMessages:devices"].safeParse(
              payload,
            );
          if (!result.success) break;
          setDevices(result.data);
          break;
        }
      }
    },
  };
}

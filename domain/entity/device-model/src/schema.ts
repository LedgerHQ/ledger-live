import { z } from "zod";

export const DeviceModelId = {
  blue: "blue",
  nanoS: "nanoS",
  nanoSP: "nanoSP",
  nanoX: "nanoX",
  stax: "stax",
  europa: "europa",
  apex: "apex",
} as const;

export type DeviceModelId = (typeof DeviceModelId)[keyof typeof DeviceModelId];

export const DeviceModelIdSchema = z.enum([
  DeviceModelId.blue,
  DeviceModelId.nanoS,
  DeviceModelId.nanoSP,
  DeviceModelId.nanoX,
  DeviceModelId.stax,
  DeviceModelId.europa,
  DeviceModelId.apex,
]);

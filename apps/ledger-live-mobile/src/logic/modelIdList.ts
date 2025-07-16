import type { DeviceModelInfo } from "@ledgerhq/types-live";

export const aggregateData = (devices: Pick<DeviceModelInfo, "modelId">[]) => {
  const aggregatedData = new Map<string, number>();

  devices.forEach(device => {
    const modelId = device.modelId;
    aggregatedData.set(
      modelId,
      aggregatedData.has(modelId) ? (aggregatedData.get(modelId) ?? 0) + 1 : 1,
    );
  });

  return Object.fromEntries(aggregatedData.entries());
};

export const getUniqueModelIdList = (devices: DeviceModelInfo[]) => [
  ...new Set(devices.map(d => d.modelId)),
];

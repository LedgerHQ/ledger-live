import { DeviceLike } from "../reducers/types";

export const aggregateData = (devices: DeviceLike[]) => {
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

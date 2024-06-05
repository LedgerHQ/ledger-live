import { ManagerApiRepository } from "@ledgerhq/device-core";
import { HttpManagerApiRepositoryFactory } from "../factories/HttpManagerApiRepositoryFactory";
import { getProviderId } from "../../manager";
import { DeviceInfo } from "@ledgerhq/types-live";

export function getAppsCatalogForDevice(
  deviceInfo: DeviceInfo,
  managerApiRepository: ManagerApiRepository = HttpManagerApiRepositoryFactory.getInstance(),
) {
  const { version: firmwareVersion, targetId } = deviceInfo;
  const providerId = getProviderId(deviceInfo);
  return managerApiRepository.catalogForDevice({ firmwareVersion, targetId, provider: providerId });
}

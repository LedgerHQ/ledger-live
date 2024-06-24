import {
  ManagerApiRepository,
  getAppsCatalogForDevice as coreGetAppsCatalogForDevice,
} from "@ledgerhq/device-core";
import { HttpManagerApiRepositoryFactory } from "../factories/HttpManagerApiRepositoryFactory";
import { getProviderId } from "../../manager";
import { DeviceInfo } from "@ledgerhq/types-live";

export function getAppsCatalogForDevice(
  deviceInfo: DeviceInfo,
  managerApiRepository: ManagerApiRepository = HttpManagerApiRepositoryFactory.getInstance(),
) {
  const { version: firmwareVersion, targetId } = deviceInfo;
  const provider = getProviderId(deviceInfo);
  return coreGetAppsCatalogForDevice({ firmwareVersion, targetId, provider }, managerApiRepository);
}

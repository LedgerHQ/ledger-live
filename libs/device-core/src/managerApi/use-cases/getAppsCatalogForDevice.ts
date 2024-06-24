import { ManagerApiRepository } from "../repositories/ManagerApiRepository";

type Params = {
  firmwareVersion: string;
  targetId: string | number;
  provider: number;
};

export async function getAppsCatalogForDevice(
  params: Params,
  managerApiRepository: ManagerApiRepository,
) {
  const { firmwareVersion, targetId, provider } = params;
  return managerApiRepository.catalogForDevice({
    firmwareVersion,
    provider,
    targetId,
  });
}

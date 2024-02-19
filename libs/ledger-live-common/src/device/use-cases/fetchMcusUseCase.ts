import { ManagerApiRepository, fetchMcus } from "@ledgerhq/live-device-core";
import { HttpManagerApiRepositoryFactory } from "../factories/HttpManagerApiRepositoryFactory";
import { McuVersion } from "@ledgerhq/types-live";

export function fetchMcusUseCase(
  managerApiRepository: ManagerApiRepository = HttpManagerApiRepositoryFactory.getInstance(),
): Promise<McuVersion[]> {
  return fetchMcus(managerApiRepository);
}

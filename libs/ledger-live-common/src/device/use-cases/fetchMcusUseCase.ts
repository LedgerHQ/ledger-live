import { ManagerApiRepository, McuVersion, fetchMcus } from "@ledgerhq/live-device-core";
import { HttpManagerApiRepositoryFactory } from "../factories/HttpManagerApiRepositoryFactory";

export function fetchMcusUseCase(
  managerApiRepository: ManagerApiRepository = HttpManagerApiRepositoryFactory.getInstance(),
): Promise<McuVersion[]> {
  return fetchMcus(managerApiRepository);
}

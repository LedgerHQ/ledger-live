import { ManagerApiRepository, fetchMcus } from "@ledgerhq/device-core";
import { HttpManagerApiRepositoryFactory } from "../factories/HttpManagerApiRepositoryFactory";

export function fetchMcusUseCase(
  managerApiRepository: ManagerApiRepository = HttpManagerApiRepositoryFactory.getInstance(),
) {
  return fetchMcus(managerApiRepository);
}

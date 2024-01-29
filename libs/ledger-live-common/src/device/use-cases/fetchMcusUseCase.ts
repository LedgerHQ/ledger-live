import { ManagerApiRepository } from "../../device-core/managerApi/repositories/ManagerApiRepository";
import { fetchMcus } from "../../device-core/managerApi/use-cases/fetchMcus";
import { HttpManagerApiRepositoryFactory } from "../factories/HttpManagerApiRepositoryFactory";

export function fetchMcusUseCase(
  managerApiRepository: ManagerApiRepository = HttpManagerApiRepositoryFactory.getInstance(),
) {
  return fetchMcus(managerApiRepository);
}

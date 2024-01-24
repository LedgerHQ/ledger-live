import { fetchMcus } from "../../device-core/managerApi/use-cases/fetchMcus";
import { HttpManagerApiRepositoryFactory } from "../factories/HttpManagerApiRepositoryFactory";

export function fetchMcusUseCase(
  managerApiRepository = HttpManagerApiRepositoryFactory.getInstance(),
) {
  return fetchMcus(managerApiRepository);
}

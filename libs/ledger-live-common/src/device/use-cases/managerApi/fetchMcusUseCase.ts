import { version } from "../../../../package.json";
import { getEnv } from "@ledgerhq/live-env";
import { HttpManagerApiRepository } from "../../../device-core/managerApi/repositories/HttpManagerApiRepository";
import { fetchMcus } from "../../../device-core/managerApi/use-cases/fetchMcus";

export default function fetchMcusUseCase(
  managerApiRepository = new HttpManagerApiRepository(getEnv("MANAGER_API_BASE"), version),
) {
  return fetchMcus(managerApiRepository);
}

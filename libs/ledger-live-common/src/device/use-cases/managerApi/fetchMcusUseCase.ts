import { version } from "../../../../package.json";
import { getEnv } from "@ledgerhq/live-env";
import { HttpManagerApiRepository } from "../../../device-core/managerApi/repositories/HttpManagerApiRepository";

export default function fetchMcusUseCase(
  managerApiRepository = new HttpManagerApiRepository(getEnv("MANAGER_API_BASE"), version),
) {
  return managerApiRepository.fetchMcus();
}

import { version } from "../../../../package.json";
import { getEnv } from "@ledgerhq/live-env";
import { ManagerApiHttpRepository } from "../../../device-core/repositories/ManagerApiRepository";

export default function fetchMcusUseCase(
  managerApiRepository = new ManagerApiHttpRepository(getEnv("MANAGER_API_BASE"), version),
) {
  return managerApiRepository.fetchMcus();
}

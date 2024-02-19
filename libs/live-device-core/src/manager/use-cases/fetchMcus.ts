import { McuVersion } from "../../types";
import { ManagerApiRepository } from "../ManagerApiRepository";

export function fetchMcus(managerApiRepository: ManagerApiRepository): Promise<McuVersion[]> {
  return managerApiRepository.fetchMcus();
}

import { ManagerApiRepository } from "../repositories/ManagerApiRepository";

export function fetchMcus(managerApiRepository: ManagerApiRepository) {
  return managerApiRepository.fetchMcus();
}

import { ManagerApiRepository } from "../ManagerApiRepository";

export function fetchMcus(
  managerApiRepository: ManagerApiRepository,
): Promise<{ name: string; id: number }[]> {
  return managerApiRepository.fetchMcus();
}

import { getEnv } from "@ledgerhq/live-env";
import { version } from "../../../package.json";
import { HttpManagerApiRepository } from "@ledgerhq/device-core";

export { type ManagerApiRepository, StubManagerApiRepository } from "@ledgerhq/device-core";
export class HttpManagerApiRepositoryFactory {
  static instance: HttpManagerApiRepository;

  static getInstance() {
    if (!this.instance) {
      this.instance = new HttpManagerApiRepository(getEnv("MANAGER_API_BASE"), version);
    }
    return this.instance;
  }
}

import { getEnv } from "@ledgerhq/live-env";
import { version } from "../../../package.json";
import { HttpManagerApiRepository } from "../../device-core/managerApi/repositories/HttpManagerApiRepository";

export class HttpManagerApiRepositoryFactory {
  static instance: HttpManagerApiRepository;

  static getInstance() {
    if (!this.instance) {
      this.instance = new HttpManagerApiRepository(getEnv("MANAGER_API_BASE"), version);
    }
    return this.instance;
  }
}

import { apiProxy } from "../_utils";

export default class ElectronStoreMock {
  constructor() {
    return apiProxy("electron-store");
  }
}

import MemoryTransport from "./logger-transport-in-memory";
import Transport from "winston-transport";
import { getEnv } from "@ledgerhq/live-common/env";

export default class RendererTransport extends Transport {
  ipcRenderer = require("electron").ipcRenderer;

  constructor(...args) {
    super(...args);
    this.memory = new MemoryTransport(...args);
  }

  getMemoryLogs() {
    return this.memory.getMemoryLogs();
  }

  log(info, callback) {
    setImmediate(() => {
      this.emit("logged", info);
    });

    // In case of experimental execution on renderer, we actually forward this whole action to memory
    if (getEnv("EXPERIMENTAL_EXECUTION_ON_RENDERER")) {
      this.memory.log(info, callback);
      return;
    }

    try {
      this.ipcRenderer.send("log", { log: info });
    } catch (e) {
      // a malformed tracking data can cause issues to arise better fail safe this
      console.error(e, info);
    }

    callback();
  }
}

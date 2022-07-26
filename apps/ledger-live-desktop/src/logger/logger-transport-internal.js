import Transport from "winston-transport";

export default class InternalTransport extends Transport {
  log(log, callback) {
    setImmediate(() => {
      this.emit("logged", log);
    });

    try {
      console.log(JSON.stringify({ type: "log", log }));
    } catch (e) {
      console.error(String(e) + ": " + String(log?.message || ""));
    }

    callback();
  }
}

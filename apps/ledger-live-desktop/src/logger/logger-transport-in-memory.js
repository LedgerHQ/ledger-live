import Transport from "winston-transport";

export default class MemoryTransport extends Transport {
  logs = [];
  capacity = 3000;

  log(info, callback) {
    setImmediate(() => {
      this.emit("logged", info);
    });

    this.logs.unshift(info);
    this.logs.splice(this.capacity);

    callback();
  }
}

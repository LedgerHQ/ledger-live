import Transport from "winston-transport";

export default class MemoryTransport extends Transport {
  _logs = [];
  capacity = 3000;

  getMemoryLogs() {
    return this._logs.slice(0).reverse();
  }

  log(info, callback) {
    setImmediate(() => {
      this.emit("logged", info);
    });

    this._logs.push(info);
    const l = this._logs.length;
    if (l > this.capacity) this._logs.splice(0, l - this.capacity);

    callback();
  }
}

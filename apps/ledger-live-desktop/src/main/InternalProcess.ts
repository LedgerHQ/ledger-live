import { fork } from "child_process";
import forceKill from "tree-kill";
class InternalProcess {
  constructor({ timeout }) {
    this.process = null;
    this.timeout = timeout;
    this.active = false;
    this.onStartCallback = null;
    this.onMessageCallback = null;
    this.onExitCallback = null;
    this.messageQueue = [];
  }

  onMessage(callback) {
    this.onMessageCallback = callback;
  }

  onExit(callback) {
    this.onExitCallback = callback;
  }

  run() {
    while (
      this.messageQueue.length &&
      this.active &&
      this.process &&
      this.process.pid &&
      this.process.connected
    ) {
      const message = this.messageQueue.shift();
      this.process.send(message);
    }
  }

  send(message) {
    this.messageQueue.push(message);
    if (this.active) {
      this.run();
    }
  }

  onStart(callback) {
    this.onStartCallback = callback;
  }

  configure(path, args, options) {
    this.path = path;
    this.args = args;
    this.options = options;
  }

  start() {
    if (this.process) {
      throw new Error("Internal process is already running !");
    }
    this.process = fork(this.path, this.args, this.options);
    this.active = true;
    const pid = this.process.pid;
    console.log(`spawned internal process ${pid}`);
    this.process.on("exit", (code, signal) => {
      this.process = null;
      if (code !== null) {
        console.log(`internal process ${pid} gracefully exited with code ${code}`);
      } else {
        console.log(`internal process ${pid} got killed by signal ${signal}`);
      }
      if (this.onExitCallback) {
        this.onExitCallback(code, signal, this.active);
      }
    });
    this.process.on("message", message => {
      if (this.onMessageCallback && this.active) {
        this.onMessageCallback(message);
      }
    });
    if (this.messageQueue.length) {
      this.run();
    }
    if (this.onStartCallback) {
      this.onStartCallback();
    }
  }

  stop() {
    return new Promise(resolve => {
      if (!this.process) {
        resolve(false);
        return;
      }
      this.messageQueue = [];
      const pid = this.process.pid;
      console.log(`ending process ${pid} ...`);
      this.active = false;
      this.process.once("exit", () => {
        resolve(true);
      });
      this.process.disconnect();
      setTimeout(() => {
        if (this.process && this.process.pid === pid) {
          forceKill(pid, "SIGKILL");
        }
      }, this.timeout);
    });
  }

  restart() {
    return this.stop().then(() => {
      this.start();
    });
  }
}
export default InternalProcess;

import { apiProxy } from "./_utils";
import * as electron from "./electron";

defineGlobal({
  __DEV__: false,
  __APP_VERSION__: "2.0.0",
  __GIT_REVISION__: "xxx",
  __SENTRY_URL__: null,
  __PRERELEASE__: "null",
  __CHANNEL__: "null",

  // Why ???
  InAppMessage: class {
    constructor() {
      return apiProxy("InAppMessage");
    }
  },

  setImmediate: setTimeout,

  module: {},

  require: function (name: string) {
    // if (name in global) {
    //   console.log(`return global.${name} for require("${name}")`);
    //   return global[name];
    // } else {
    //   console.log(name, "is not in global");
    // }
    // if (name === "fs") {
    //   console.trace("REQUIRED FS");
    //   return apiProxy("fs", { length: 1 });
    // }

    const mocks = {
      // fs: apiProxy("fs"),

      electron,
      https: {
        Agent: class {
          get(key: string) {
            console.log("Accessed https.Agent", key);
            return () => {};
          }
        },
      },
    };
    return apiProxy(`require(${name})`, mocks[name]);
  },
});

function defineGlobal(ext: Partial<Global> & Record<string, unknown>) {
  Object.defineProperties(
    global,
    Object.fromEntries(
      Object.entries(ext).map(([key, value]) => [key, { value, writable: false }]),
    ),
  );
}

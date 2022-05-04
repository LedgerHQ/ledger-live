/* eslint-disable no-console */
import { botSpeculosProxy } from "@ledgerhq/live-common/lib/botSpeculosProxy";
import { getEnv } from "@ledgerhq/live-common/lib/env";
import { generateMnemonic } from "bip39";
import { of } from "rxjs";
export default {
  description:
    "Run a bot test engine with speculos that automatically create accounts and do transactions",
  args: [
    {
      name: "port",
      alias: "p",
      type: String,
      desc: "specify the http port to use (default: 4377)",
    },
    {
      name: "wsPort",
      alias: "w",
      type: String,
      desc: "specify the websocket port to use (default: 8435)",
    },
    {
      name: "token",
      alias: "t",
      type: String,
      desc: "Token to restrict the access to http and webservices"
    }
  ],
  job: (arg: any) => {
    const SEED = getEnv("SEED");

    if (!SEED) {
      console.log(
        "You have not defined a SEED yet. Please use a new one SPECIFICALLY to this test and with NOT TOO MUCH funds. USE THIS BOT TO YOUR OWN RISK!\n" +
          "here is a possible software seed you can use:\n" +
          "SEED='" +
          generateMnemonic(256) +
          "'"
      );
      throw new Error("Please define a SEED env variable to run this bot.");
    }

    botSpeculosProxy(arg);
    return of<any>(`Proxy bot log is listening to port http ${arg.port || 4377} and ws ${arg.wsPort || 8435}`);
  },
};

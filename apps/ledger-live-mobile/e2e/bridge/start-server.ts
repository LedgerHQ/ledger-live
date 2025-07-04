/* eslint-disable no-console */
/* 

This script will allow you to upload app.json userdata files into LLM

Steps:
https://ledgerhq.atlassian.net/wiki/spaces/PTX/pages/4295000160/Switch+devices+with+LLM

1. Run the react native app in one terminal: pnpm mobile start
2. Get the name (excluding the .json file extension) of the app.json file you want in the e2e/userdata folder. Run the following command in another terminal: pnpm mobile e2e:loadConfig <EXAMPLE FILE NAME>
3. Run the mobile app in mock mode by adding MOCK=1 to the .env file and then running: pnpm mobile ios
4. Every time you reload the app or make a code change in LLM and save it, the app.json data will refresh
*/

import { access, constants } from "fs";
import path from "path";
import { init, loadConfig } from "./server";
import { ServerData } from "./types";
import { Subject } from "rxjs";

const filePath = process.argv[2];

const fullFilePath = path.resolve("e2e", "userdata", `${filePath}.json`);

global.webSocket = {
  wss: undefined,
  ws: undefined,
  messages: {},
  e2eBridgeServer: new Subject<ServerData>(),
};

access(fullFilePath, constants.F_OK, err => {
  if (err) {
    throw new Error(`${fullFilePath} does not exist`);
  } else {
    // starts the server
    init(undefined, () => {
      // this is run when the server receives a connection - in this case when the app finishes loading and calls the bridge client `init` function
      loadConfig(filePath, true);
    });
  }
});

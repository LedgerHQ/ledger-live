import * as server from "./server";

server.init(undefined, () => {
  server
    .loadConfig("1AccountBTC1AccountETH", true)
    .then(() => console.log("Config loaded"));
});

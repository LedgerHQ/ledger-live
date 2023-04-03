let updater: {
  quitAndInstall?: () => void;
  downloadUpdate?: () => void;
} = {};
export default (type: string) => {
  console.log(type);
  switch (type) {
    case "init":
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      updater = require("./init").default;
      break;
    case "quit-and-install":
      if (!updater.quitAndInstall) {
        console.error(`Auto-update error: quitAndInstall called before init`);
      } else {
        updater.quitAndInstall();
      }
      break;
    case "download-update":
      if (!updater.downloadUpdate) {
        console.error(`Auto-update error: downloadUpdate called before init`);
      } else {
        updater.downloadUpdate();
      }
      break;
    default:
      console.error(`Unknown updater message type: ${type}`);
      break;
  }
};

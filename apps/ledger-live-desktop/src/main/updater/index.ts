let updater: {
  quitAndInstall?: () => void;
} = {};
export default (type: string) => {
  // Auto-updater is disabled for Mac App Store builds — the App Store handles updates.
  if (process.mas) {
    return;
  }

  console.log(`UPDATER: ${type}`);
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
    default:
      console.error(`Unknown updater message type: ${type}`);
      break;
  }
};

// FIXME find a better way to do this
const resolveUserDataDirectory = () => {
  const { LEDGER_CONFIG_DIRECTORY } = process.env;
  if (LEDGER_CONFIG_DIRECTORY) return LEDGER_CONFIG_DIRECTORY;

  if (process.type === "browser") {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const electron = require("electron");
    return electron.app.getPath("userData");
  }
  return window.api.pathUserdata;
};

export default resolveUserDataDirectory;

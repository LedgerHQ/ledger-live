// @flow

const resolveUserDataDirectory = () => {
  const { LEDGER_CONFIG_DIRECTORY } = process.env;
  if (LEDGER_CONFIG_DIRECTORY) return LEDGER_CONFIG_DIRECTORY;
  // $FlowFixMe
  const electron = process.type === "browser" ? require("electron") : require("@electron/remote");
  console.warn({ path: electron.app.getPath("userData") });
  return electron.app.getPath("userData");
};

export default resolveUserDataDirectory;

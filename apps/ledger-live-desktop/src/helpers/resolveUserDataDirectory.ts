const resolveUserDataDirectory = () => {
  const { LEDGER_CONFIG_DIRECTORY } = process.env;
  if (LEDGER_CONFIG_DIRECTORY) return LEDGER_CONFIG_DIRECTORY;

  const electron = process.type === "browser" ? require("electron") : require("@electron/remote");
  return electron.app.getPath("userData");
};
export default resolveUserDataDirectory;

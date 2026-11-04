/** What the user did in the settings. The apps decide what to do with it (analytics...). */
export type AccountSettingsEvent =
  | "changeName"
  | "validateChangeName"
  | "viewLogs"
  | "copyLogs"
  | "viewExplorer"
  | "removeFromPortfolio"
  | "validateRemove"
  | "cancelRemove";

export type AccountSettingsEventHandler = (event: AccountSettingsEvent) => void;

import { track } from "~/renderer/analytics/segment";
import electron from "electron";
import { isUrlSafe } from "~/helpers/urlSafety";

let shell: Electron.Shell | undefined;
if (!process.env.STORYBOOK_ENV) {
  shell = electron.shell;
}

export const openURL = (url: string, customEventName = "OpenURL", extraParams: object = {}) => {
  if (!isUrlSafe(url)) {
    console.warn(`Blocked potentially unsafe URL: ${url}`);
    return;
  }
  if (customEventName) {
    track(customEventName, {
      ...extraParams,
      url,
    });
  }
  if (shell) shell.openExternal(url);
};

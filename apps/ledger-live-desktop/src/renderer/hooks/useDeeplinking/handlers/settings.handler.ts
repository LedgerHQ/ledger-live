import { DeeplinkHandler } from "../types";

const VALID_SETTINGS_PATHS = ["accounts", "about", "help", "experimental"] as const;

export const settingsHandler: DeeplinkHandler<"settings"> = (route, { navigate }) => {
  const { path } = route;

  switch (path) {
    case "general":
      // "general" maps to "display" in the actual route
      navigate("/settings/display");
      break;

    case "accounts":
    case "about":
    case "help":
    case "experimental":
      navigate(`/settings/${path}`);
      break;

    default:
      navigate("/settings");
      break;
  }
};

export function isValidSettingsPath(path: string): path is (typeof VALID_SETTINGS_PATHS)[number] {
  return VALID_SETTINGS_PATHS.includes(path as (typeof VALID_SETTINGS_PATHS)[number]);
}

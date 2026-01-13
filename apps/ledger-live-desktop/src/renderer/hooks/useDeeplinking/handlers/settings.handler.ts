import { DeeplinkHandler } from "../types";

export const settingsHandler: DeeplinkHandler<"settings"> = (route, { navigate }) => {
  const { path } = route;

  switch (path) {
    case "general":
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

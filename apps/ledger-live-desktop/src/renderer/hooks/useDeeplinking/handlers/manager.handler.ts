import { DeeplinkHandler } from "../types";

export const managerHandler: DeeplinkHandler<"myledger"> = (route, { navigate }) => {
  const { installApp } = route;

  if (!installApp || typeof installApp !== "string") {
    navigate("/manager");
  } else {
    navigate("/manager", undefined, `?q=${installApp}`);
  }
};

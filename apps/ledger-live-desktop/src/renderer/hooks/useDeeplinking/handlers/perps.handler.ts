import { DeeplinkHandler } from "../types";

export const perpsHandler: DeeplinkHandler<"perps"> = (_route, { navigate }) => {
  navigate("/perps");
};

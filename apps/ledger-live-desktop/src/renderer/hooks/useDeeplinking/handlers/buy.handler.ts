import { DeeplinkHandler } from "../types";

export const buyHandler: DeeplinkHandler<"buy"> = (route, { navigate }) => {
  navigate("/exchange", undefined, route.search);
};

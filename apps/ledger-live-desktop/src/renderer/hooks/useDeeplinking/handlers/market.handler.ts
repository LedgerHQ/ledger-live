import { DeeplinkHandler } from "../types";

export const marketHandler: DeeplinkHandler<"market"> = (route, { navigate }) => {
  const { path } = route;

  if (path) {
    navigate(`/market/${path}`);
  } else {
    navigate("/market");
  }
};

export const assetHandler: DeeplinkHandler<"asset"> = (route, { navigate }) => {
  const { path } = route;

  if (path) {
    navigate(`/asset/${path}`);
  }
};

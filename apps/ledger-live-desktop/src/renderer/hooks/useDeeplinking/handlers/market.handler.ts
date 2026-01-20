import { findCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { DeeplinkHandler } from "../types";

export const marketHandler: DeeplinkHandler<"market"> = (route, { navigate }) => {
  const { path } = route;

  if (path) {
    const normalizedPath = path.trim().toLowerCase();
    const currency = findCryptoCurrencyById(normalizedPath);

    if (currency) {
      navigate(`/market/${currency.id}`);
      return;
    }
  }

  navigate(`/market`);
};

export const assetHandler: DeeplinkHandler<"asset"> = (route, { navigate }) => {
  const { path } = route;

  if (path) {
    navigate(`/asset/${path}`);
  }
};

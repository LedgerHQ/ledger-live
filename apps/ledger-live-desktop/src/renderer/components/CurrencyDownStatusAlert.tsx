import React from "react";
import { createCustomErrorClass } from "@ledgerhq/errors";
import { TokenCurrency, CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import ErrorBanner from "./ErrorBanner";
import { useFilteredServiceStatus } from "@ledgerhq/live-common/notifications/ServiceStatusProvider/index";
type Props = {
  currencies: Array<CryptoCurrency | TokenCurrency>;
  hideStatusIncidents?: boolean;
};
const ServiceStatusWarning = createCustomErrorClass("ServiceStatusWarning");
const CurrencyDownStatusAlert = ({ currencies, hideStatusIncidents }: Props) => {
  const errors = [];
  const { incidents } = useFilteredServiceStatus({
    tickers: currencies.map(c => c.ticker),
  });
  if (!hideStatusIncidents)
    incidents
      .filter(c => c.components && c.components.length > 0)
      .forEach(inc => {
        errors.push(new ServiceStatusWarning(inc.name));
      });
  return errors.length > 0 ? (
    <div>
      {errors.map((e, i) => (
        <ErrorBanner key={i} error={e} warning />
      ))}
    </div>
  ) : null;
};
export default CurrencyDownStatusAlert;

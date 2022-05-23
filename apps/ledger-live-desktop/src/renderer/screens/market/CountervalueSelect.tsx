import React, { useCallback, useMemo, memo } from "react";
import { supportedCountervalues, SupportedCoutervaluesData } from "~/renderer/reducers/settings";

import Dropdown from "./DropDown";
import Track from "~/renderer/analytics/Track";
import { useTranslation } from "react-i18next";
import { Currency } from "@ledgerhq/live-common/lib/types";

type Props = {
  counterCurrency: string;
  setCounterCurrency: (counterCurrency: string) => void;
  supportedCounterCurrencies: string[];
};

function CounterValueSelect({
  counterCurrency,
  setCounterCurrency,
  supportedCounterCurrencies,
}: Props) {
  const { t } = useTranslation();

  const handleChangeCounterValue = useCallback(
    (item: { currency: Currency }) => {
      setCounterCurrency(item.currency.ticker);
    },
    [setCounterCurrency],
  );

  const options = useMemo(
    () =>
      supportedCountervalues.filter(({ value }: SupportedCoutervaluesData) =>
        supportedCounterCurrencies.includes(value?.toLowerCase()),
      ),
    [supportedCounterCurrencies],
  );

  const cvOption = useMemo(
    () =>
      supportedCountervalues.find(
        (f: SupportedCoutervaluesData) =>
          f?.value?.toLowerCase() === counterCurrency?.toLowerCase(),
      ),
    [counterCurrency],
  );

  return (
    <>
      <Track onUpdate event="MarketCounterValueSelect" counterValue={cvOption && cvOption.value} />
      <Dropdown
        label={t("market.currency")}
        name="currency"
        menuPortalTarget={document.body}
        onChange={handleChangeCounterValue}
        options={options}
        value={cvOption}
        searchable
      />
    </>
  );
}

export default memo<Props>(CounterValueSelect);

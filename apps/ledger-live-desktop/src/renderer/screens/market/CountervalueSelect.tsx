import React, { useCallback, useMemo, memo } from "react";
import {
  supportedCounterValuesSelector,
  SupportedCountervaluesData,
} from "~/renderer/reducers/settings";
import Dropdown from "./DropDown";
import Track from "~/renderer/analytics/Track";
import { useTranslation } from "react-i18next";
import { Currency } from "@ledgerhq/types-cryptoassets";
import { useSelector } from "react-redux";

type Props = {
  counterCurrency?: string;
  setCounterCurrency: (counterCurrency: string) => void;
  supportedCounterCurrencies: string[];
};

function CounterValueSelect({
  counterCurrency,
  setCounterCurrency,
  supportedCounterCurrencies,
}: Props) {
  const { t } = useTranslation();
  const supportedCountervalues = useSelector(supportedCounterValuesSelector);

  const handleChangeCounterValue = useCallback(
    (item: { currency: Currency } | null) => {
      // TODO: double check if this is correct to pass undefined/null ticker
      // @ts-expect-error because the types tell us that it should not be the case
      setCounterCurrency(item?.currency?.ticker);
    },
    [setCounterCurrency],
  );

  const options = useMemo(
    () =>
      supportedCountervalues.filter(({ value }: SupportedCountervaluesData) =>
        supportedCounterCurrencies.includes(value?.toLowerCase()),
      ),
    [supportedCounterCurrencies, supportedCountervalues],
  );

  const cvOption = useMemo(
    () =>
      supportedCountervalues.find(
        (f: SupportedCountervaluesData) =>
          f?.value?.toLowerCase() === counterCurrency?.toLowerCase(),
      ),
    [counterCurrency, supportedCountervalues],
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

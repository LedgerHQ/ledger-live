import React, { useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "LLD/hooks/redux";
import { setCounterValue } from "~/renderer/actions/settings";
import {
  SupportedCountervaluesData,
  counterValueCurrencySelector,
  supportedCounterValuesSelector,
} from "~/renderer/reducers/settings";
import Select from "~/renderer/components/Select";
import Track from "~/renderer/analytics/Track";

const CounterValueSelectComponent: React.FC = () => {
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const supportedCounterValues = useSelector(supportedCounterValuesSelector);
  const dispatch = useDispatch();

  const handleChangeCounterValue = useCallback(
    (item?: SupportedCountervaluesData | null) => {
      if (!item) return;
      dispatch(setCounterValue(item.currency.ticker));
    },
    [dispatch],
  );

  const cvOption = useMemo(
    () => supportedCounterValues.find(f => f.value === counterValueCurrency.ticker),
    [counterValueCurrency, supportedCounterValues],
  );

  return (
    <>
      <Track onUpdate event="CounterValueSelect" counterValue={cvOption && cvOption.value} />
      <Select
        small
        minWidth={260}
        onChange={handleChangeCounterValue}
        renderValue={({ data }) => data?.label}
        options={supportedCounterValues}
        value={cvOption}
      />
    </>
  );
};

const CounterValueSelect = React.memo(CounterValueSelectComponent);
CounterValueSelect.displayName = "CounterValueSelect";

export default CounterValueSelect;

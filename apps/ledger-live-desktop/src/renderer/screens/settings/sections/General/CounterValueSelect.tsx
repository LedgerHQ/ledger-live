import React, { useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setCounterValue } from "~/renderer/actions/settings";
import {
  SupportedCountervaluesData,
  counterValueCurrencySelector,
  supportedCounterValuesSelector,
} from "~/renderer/reducers/settings";
import Select from "~/renderer/components/Select";
import Track from "~/renderer/analytics/Track";

const CounterValueSelect = React.memo<{}>(function CounterValueSelect() {
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
        itemToString={(item: { name: string }) => item.name}
        renderSelected={(item: { name: string }) => item && item.name}
        options={supportedCounterValues}
        value={cvOption}
      />
    </>
  );
});
export default CounterValueSelect;

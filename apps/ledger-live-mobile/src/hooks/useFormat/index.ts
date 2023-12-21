import {
  formatCurrencyUnit,
  formatCurrencyUnitOptions,
} from "@ledgerhq/live-common/currencies/index";
import { Unit } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import { useSelector } from "react-redux";
import useSystem from "~/hooks/useSystem";
import { discreetModeSelector } from "~/reducers/settings";

const useFormat = () => {
  const { i18 } = useSystem();
  const discreet = useSelector(discreetModeSelector);

  const defaultOptions: formatCurrencyUnitOptions = {
    disableRounding: true,
    showCode: true,
    locale: i18.locale,
    discreet,
  };

  const formatCurrency = (
    unit: Unit,
    value: string | BigNumber | number,
    options: formatCurrencyUnitOptions = defaultOptions,
  ) =>
    formatCurrencyUnit(unit, new BigNumber(value), {
      ...defaultOptions,
      ...options,
    });

  return { formatCurrency };
};

export default useFormat;

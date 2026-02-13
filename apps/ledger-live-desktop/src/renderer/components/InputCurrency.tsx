import React, { useState, useEffect, useCallback } from "react";
import { BigNumber } from "bignumber.js";
import { uncontrollable } from "uncontrollable";
import styled from "styled-components";
import { useSelector } from "LLD/hooks/redux";
import { localeSelector } from "~/renderer/reducers/settings";
import { formatCurrencyUnit, sanitizeValueString } from "@ledgerhq/live-common/currencies/index";
import noop from "lodash/noop";
import Box from "~/renderer/components/Box";
import Input, { Props as InputProps } from "~/renderer/components/Input";
import Select from "~/renderer/components/Select";
import { Unit } from "@ledgerhq/types-cryptoassets";
import type { ReactNode } from "react";

const unitGetOptionValue = (unit: Unit) => String(unit.magnitude);

function format(
  unit: Unit,
  value: BigNumber,
  {
    locale,
    isFocused,
    showAllDigits,
    subMagnitude,
  }: {
    locale: string;
    isFocused: boolean;
    showAllDigits?: boolean;
    subMagnitude?: number;
  },
) {
  return formatCurrencyUnit(unit, value, {
    locale,
    useGrouping: !isFocused,
    disableRounding: true,
    showAllDigits: !!showAllDigits && !isFocused,
    subMagnitude: value.isLessThan(1) ? subMagnitude : 0,
  });
}

const Currencies = styled(Box)`
  top: -1px;
  right: -1px;
  width: 100px;
`;

function stopPropagation(e: React.SyntheticEvent) {
  e.stopPropagation();
}

type OwnProps = Omit<InputProps, "value" | "onChange" | "ref"> & {
  onChangeFocus?: (a: boolean) => void;
  onChange: (b: BigNumber, a: Unit) => void;
  // FIXME Unit shouldn't be provided (this is not "standard" onChange)
  onChangeUnit?: (a: Unit) => void;
  renderRight?: ReactNode;
  defaultUnit?: Unit;
  unit?: Unit;
  units?: Unit[];
  value: BigNumber | undefined | null;
  showAllDigits?: boolean;
  subMagnitude?: number;
  allowZero?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  decimals?: number;
};

type Props = {
  unit: Unit;
  units: Unit[];
  onChangeFocus: (a: boolean) => void;
  onChangeUnit: (a: Unit) => void;
  locale: string;
  forwardedRef: React.ForwardedRef<HTMLInputElement> | undefined | null;
  placeholder?: string;
  loading: boolean;
} & OwnProps;

type InputState = {
  isFocused: boolean;
  displayValue: string;
  rawValue: string;
};

const defaultProps = {
  onChangeFocus: noop,
  onChange: noop,
  renderRight: null,
  units: [],
  value: null,
  showAllDigits: false,
  subMagnitude: 0,
  allowZero: false,
  autoFocus: false,
  loading: false,
};

function InputCurrency(props: Props) {
  const {
    unit,
    units,
    value,
    showAllDigits,
    subMagnitude,
    allowZero,
    locale,
    onChange,
    onChangeFocus,
    onChangeUnit,
    forwardedRef,
    placeholder,
    loading,
    autoFocus,
    decimals,
    renderRight,
    ...rest
  } = { ...defaultProps, ...props };

  const [state, setState] = useState<InputState>({
    isFocused: false,
    displayValue: "",
    rawValue: "",
  });

  const syncInput = useCallback(
    (isFocused: boolean) => {
      setState(prev => {
        const valueFromRaw = prev.rawValue
          ? BigNumber(sanitizeValueString(unit, prev.rawValue, locale).value)
          : value ?? null;
        const displayValue =
          !valueFromRaw || (valueFromRaw.isZero() && !allowZero)
            ? ""
            : format(unit, valueFromRaw, {
                locale,
                isFocused,
                showAllDigits,
                subMagnitude,
              });
        return { ...prev, isFocused, displayValue };
      });
    },
    [unit, locale, showAllDigits, subMagnitude, allowZero, value],
  );

  // Mount: sync with initial focus state
  useEffect(() => {
    const isFocused = !!autoFocus;
    const valueFromRaw = value ?? null;
    const displayValue =
      !valueFromRaw || (valueFromRaw.isZero() && !allowZero)
        ? ""
        : format(unit, valueFromRaw, {
            locale,
            isFocused,
            showAllDigits,
            subMagnitude,
          });
    setState(prev => ({ ...prev, isFocused, displayValue }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When value/unit/showAllDigits change and not focused, reformat display
  useEffect(() => {
    setState(prev => {
      if (prev.isFocused) return prev;
      const displayValue =
        !value || value.isNaN() || value.isZero()
          ? ""
          : format(unit, value, {
              locale,
              isFocused: false,
              showAllDigits,
              subMagnitude,
            });
      return { ...prev, rawValue: "", displayValue };
    });
  }, [value, unit, showAllDigits, subMagnitude, locale]);

  const handleChange = useCallback(
    (val: string) => {
      const v = decimals === 0 ? val.replace(/[.,]/g, "") : val;
      const r = sanitizeValueString(unit, v, locale);
      const satoshiValue = BigNumber(r.value);
      if (!value || !value.isEqualTo(satoshiValue)) {
        onChange(satoshiValue, unit);
      }
      setState(prev => ({ ...prev, rawValue: v, displayValue: r.display }));
    },
    [unit, value, locale, decimals, onChange],
  );

  const handleBlur = useCallback(() => {
    syncInput(false);
    onChangeFocus(false);
  }, [syncInput, onChangeFocus]);

  const handleFocus = useCallback(() => {
    syncInput(true);
    onChangeFocus(true);
  }, [syncInput, onChangeFocus]);

  const renderOption = (item: { data: Unit }) => item.data.code;
  const renderValue = (item: { data: Unit }) => item.data.code;

  const renderListUnits = () => {
    const avoidEmptyValue = (val?: Unit | null) => val && onChangeUnit(val);
    if (units.length <= 1) return null;
    return (
      <Currencies onClick={stopPropagation}>
        <Select
          onChange={avoidEmptyValue}
          options={units}
          value={unit}
          getOptionValue={unitGetOptionValue}
          renderOption={renderOption}
          renderValue={renderValue}
          fakeFocusRight={state.isFocused}
          isRight
        />
      </Currencies>
    );
  };

  return (
    <Input
      {...rest}
      ff="Inter"
      ref={forwardedRef}
      value={state.displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      renderRight={renderRight || renderListUnits()}
      loading={loading}
      placeholder={
        state.displayValue
          ? ""
          : placeholder ||
            format(unit, BigNumber(0), {
              locale,
              isFocused: false,
              showAllDigits,
              subMagnitude,
            })
      }
    />
  );
}

const InputCurrencyWithLocale = (props: Omit<Props, "locale">) => {
  const locale = useSelector(localeSelector);
  return <InputCurrency {...props} locale={locale} />;
};

const Connected = uncontrollable(InputCurrencyWithLocale, {
  unit: "onChangeUnit",
});

const InputCurrencyForwarded = React.forwardRef<HTMLInputElement, OwnProps>(
  function InputCurrencyForwarded(forwardedProps, ref) {
    return <Connected {...forwardedProps} forwardedRef={ref} />;
  },
);

export default InputCurrencyForwarded;

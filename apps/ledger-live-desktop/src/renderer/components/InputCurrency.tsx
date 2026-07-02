import React, { useState, useLayoutEffect, useCallback, useRef, useImperativeHandle } from "react";
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

function InputCurrency(props: Props) {
  const {
    unit,
    units = [],
    value = null,
    showAllDigits = false,
    subMagnitude = 0,
    allowZero = false,
    locale,
    onChange = noop,
    onChangeFocus = noop,
    onChangeUnit,
    forwardedRef,
    placeholder,
    loading = false,
    autoFocus = false,
    disabled,
    decimals,
    renderRight = null,
    ...rest
  } = props;

  const [state, setState] = useState<InputState>(() => {
    const isFocused = !!autoFocus;
    const initialValue = value ?? null;
    const displayValue =
      !initialValue || (initialValue.isZero() && !allowZero)
        ? ""
        : format(unit, initialValue, { locale, isFocused, showAllDigits, subMagnitude });
    return { isFocused, displayValue, rawValue: "" };
  });

  // Hold the DOM input via an object ref so Input's click-to-focus (which needs a
  // ref exposing `.current`) keeps working, and expose it to any forwarded ref.
  const innerRef = useRef<HTMLInputElement | null>(null);
  const caretRef = useRef<number | null>(null);
  useImperativeHandle(forwardedRef, () => innerRef.current as HTMLInputElement, []);

  const syncInput = useCallback(
    (isFocused: boolean) => {
      setState(prev => {
        const valueFromRaw = prev.rawValue
          ? BigNumber(sanitizeValueString(unit, prev.rawValue, locale).value)
          : (value ?? null);
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

  // Synchronously reformat display when value/unit change while not focused
  useLayoutEffect(() => {
    setState(prev => {
      if (prev.isFocused && !disabled) return prev;
      const displayValue =
        !value || value.isNaN() || value.isZero()
          ? ""
          : format(unit, value, {
              locale,
              isFocused: false,
              showAllDigits,
              subMagnitude,
            });
      return { ...prev, isFocused: false, rawValue: "", displayValue };
    });
  }, [value, unit, showAllDigits, subMagnitude, locale, disabled]);

  const handleChange = useCallback(
    (val: string) => {
      const stripSeparators = (s: string) => (decimals === 0 ? s.replace(/[.,]/g, "") : s);
      const v = stripSeparators(val);
      const r = sanitizeValueString(unit, v, locale);

      // Capture the caret before onChange can schedule a parent re-render.
      // sanitizeValueString can drop overflow chars (e.g. the 10th Gwei decimal),
      // so React reassigns the value and would push the caret to the end; re-map it
      // through the same sanitizer on the pre-caret text so it lands correctly.
      const selectionStart = innerRef.current?.selectionStart;
      if (selectionStart == null) {
        caretRef.current = null;
      } else {
        const beforeCaret = stripSeparators(val.slice(0, selectionStart));
        caretRef.current = sanitizeValueString(unit, beforeCaret, locale).display.length;
      }

      const satoshiValue = BigNumber(r.value);
      if (!value || !value.isEqualTo(satoshiValue)) {
        onChange(satoshiValue, unit);
      }
      setState(prev => ({ ...prev, rawValue: v, displayValue: r.display }));
    },
    [unit, value, locale, decimals, onChange],
  );

  // Restore the caret after commit (React moved it to the end). No deps: must also
  // fire when the sanitized value is unchanged. Only acts right after a user edit.
  useLayoutEffect(() => {
    const caret = caretRef.current;
    if (caret == null || !innerRef.current) return;
    caretRef.current = null;
    const pos = Math.min(caret, state.displayValue.length);
    innerRef.current.setSelectionRange(pos, pos);
  });

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
      disabled={disabled}
      ff="Inter"
      ref={innerRef}
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

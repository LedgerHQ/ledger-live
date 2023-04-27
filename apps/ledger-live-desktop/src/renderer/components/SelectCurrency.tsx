import React, { useCallback, useMemo, useState, memo } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import Fuse from "fuse.js";
import { CryptoOrTokenCurrency, Currency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useCurrenciesByMarketcap } from "@ledgerhq/live-common/currencies/index";
import useEnv from "~/renderer/hooks/useEnv";
import Select from "~/renderer/components/Select";
import { CreateStylesReturnType } from "~/renderer/components/Select/createStyles";
import Box from "~/renderer/components/Box";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import Text from "./Text";
import { ThemeConfig } from "react-select/src/theme";

type CurrencyOption = Currency & {
  value: Currency;
  label: Currency["name"];
  currency: Currency;
  isDisabled: boolean;
};

type Props<Option extends CurrencyOption, IsMulti extends boolean = false> = {
  onChange: (a?: Option | null) => void;
  currencies: Option[];
  value?: Option;
  placeholder?: string;
  autoFocus?: boolean;
  minWidth?: number;
  width?: number;
  rowHeight?: number;
  isCurrencyDisabled?: (a: Option) => boolean;
  isDisabled?: boolean;
  id?: string;
  renderValueOverride?: ({ data }: { data: Option }) => React.ReactNode;
  stylesMap?: (a: ThemeConfig) => CreateStylesReturnType<Option, IsMulti>;
};
const getOptionValue = <C extends CurrencyOption>(c: C) => (c as CryptoOrTokenCurrency).id;

// TODO: I removed the {...props} that was passed to Select. We might need to check out it doesnt break other stuff
const SelectCurrency = <Option extends CurrencyOption>({
  onChange,
  value,
  placeholder,
  currencies,
  autoFocus,
  minWidth,
  width,
  rowHeight = 47,
  renderValueOverride,
  isCurrencyDisabled,
  isDisabled,
  id,
  stylesMap,
}: Props<Option>) => {
  const { t } = useTranslation();
  const devMode = useEnv("MANAGER_DEV_MODE");
  let c = currencies;
  if (!devMode) {
    c = c.filter(c => c.type !== "CryptoCurrency" || !c.isTestnetFor);
  }
  const [searchInputValue, setSearchInputValue] = useState("");
  const cryptos = useCurrenciesByMarketcap(c);
  const onChangeCallback = useCallback(item => onChange(item ? item.currency : null), [onChange]);
  const noOptionsMessage = useCallback(
    ({ inputValue }: { inputValue: string }) =>
      inputValue
        ? t("common.selectCurrencyNoOption", {
            currencyName: inputValue,
          })
        : t("common.selectCurrencyEmptyOption"),
    [t],
  );
  const options = useMemo(
    () =>
      cryptos.map(c => ({
        ...c,
        value: c,
        label: c.name,
        currency: c,
        isDisabled: isCurrencyDisabled ? isCurrencyDisabled(c) : false,
      })),
    [isCurrencyDisabled, cryptos],
  );
  const fuseOptions = useMemo(
    () => ({
      threshold: 0.1,
      keys: ["name", "ticker"],
      shouldSort: false,
    }),
    [],
  );
  const manualFilter = useCallback(() => {
    const fuse = new Fuse(options, fuseOptions);
    return searchInputValue.length > 0 ? fuse.search(searchInputValue) : options;
  }, [searchInputValue, options, fuseOptions]);
  const filteredOptions = manualFilter();
  return (
    <Select
      id={id}
      autoFocus={autoFocus}
      value={value}
      options={filteredOptions}
      filterOption={null}
      getOptionValue={getOptionValue}
      renderOption={renderOption}
      renderValue={renderValueOverride || renderOption}
      onInputChange={v => setSearchInputValue(v)}
      inputValue={searchInputValue}
      placeholder={placeholder || t("common.selectCurrency")}
      noOptionsMessage={noOptionsMessage}
      onChange={onChangeCallback}
      minWidth={minWidth}
      width={width}
      isDisabled={isDisabled}
      rowHeight={rowHeight}
      stylesMap={stylesMap}
    />
  );
};
const OptionMultilineContainer = styled(Box)`
  line-height: 1.3em;
`;
const CurrencyLabel = styled(Text).attrs(() => ({
  color: "palette.text.shade60",
  ff: "Inter|SemiBold",
  fontSize: 2,
}))`
  padding: 0 6px;
  height: 24px;
  line-height: 24px;
  border-color: currentColor;
  border-width: 1px;
  border-style: solid;
  border-radius: 4px;
  text-align: center;
  flex: 0 0 auto;
  box-sizing: content-box;
`;
export function CurrencyOption({
  currency,
  singleLineLayout = true,
  hideParentTag = false,
  tagVariant = "default",
}: {
  currency: Currency;
  singleLineLayout?: boolean;
  hideParentTag?: boolean;
  tagVariant?: "default" | "thin";
}) {
  const isParentTagDisplayed = !hideParentTag && (currency as TokenCurrency).parentCurrency;
  const textContents = singleLineLayout ? (
    <>
      <Box grow ff="Inter|SemiBold" color="palette.text.shade100" fontSize={4}>
        {`${currency.name} (${currency.ticker})`}
      </Box>
      {isParentTagDisplayed ? (
        <CurrencyLabel>{(currency as TokenCurrency).parentCurrency.name}</CurrencyLabel>
      ) : null}
    </>
  ) : (
    <>
      <OptionMultilineContainer flex="1">
        <Text ff="Inter|SemiBold" fontSize={4} color="palette.text.shade100">
          {currency.name}
        </Text>
        <Box horizontal alignItems="center">
          <Text color="palette.text.shade40" ff="Inter|Medium" fontSize={3}>
            {currency.ticker}{" "}
            {isParentTagDisplayed && tagVariant === "thin"
              ? `(${(currency as TokenCurrency).parentCurrency.name})`
              : null}
          </Text>
        </Box>
      </OptionMultilineContainer>
      {isParentTagDisplayed && tagVariant === "default" ? (
        <CurrencyLabel>{(currency as TokenCurrency).parentCurrency.name}</CurrencyLabel>
      ) : null}
    </>
  );
  return (
    <Box grow horizontal alignItems="center" flow={2}>
      <CryptoCurrencyIcon circle currency={currency} size={26} />
      {textContents}
    </Box>
  );
}
const renderOption = <Option extends CurrencyOption>({ data }: { data: Option }) => (
  <CurrencyOption currency={data.currency} />
);
export default memo<Props<CurrencyOption>>(SelectCurrency);

import React from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { CreateStylesReturnType } from "~/renderer/components/Select/createStyles";
import { AccountOption, Option as SelectAccountOption } from "~/renderer/components/SelectAccount";
import { CurrencyOption } from "~/renderer/components/SelectCurrency";
import { OptionTypeBase } from "react-select";
import { ThemeConfig } from "react-select/src/theme";

export const selectRowStylesMap: <T extends OptionTypeBase>(
  a: CreateStylesReturnType<T> & ThemeConfig,
) => CreateStylesReturnType<T> = styles => ({
  ...styles,
  control: (provided, state) => ({
    ...styles?.control?.(provided, state),
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  }),
  menu: (provided, state) => ({
    ...styles?.menu?.(provided, state),
    width: "200%",
  }),
  valueContainer: (styles: object) => ({
    ...styles,
    height: "100%",
  }),
});

export const amountInputContainerProps = {
  noBorderLeftRadius: true,
};

export const renderAccountValue = ({ data }: { data: SelectAccountOption }) =>
  data.account ? (
    <AccountOption account={data.account} isValue singleLineLayout={false} hideDerivationTag />
  ) : null;

export const renderCurrencyValue = ({ data: currency }: { data: CryptoOrTokenCurrency }) => {
  return currency ? (
    <CurrencyOption currency={currency} singleLineLayout={false} tagVariant="thin" />
  ) : null;
};

import { getAccountCurrency, getAccountName } from "@ledgerhq/live-common/account/index";
import { TFunction, withTranslation } from "react-i18next";
import { Account, SubAccount } from "@ledgerhq/types-live";
import React, { useCallback, useState } from "react";
import { createFilter } from "react-select";
import { Option as ReactSelectOption } from "react-select/src/filters";
import Select from "~/renderer/components/Select";
import { MenuOption } from "~/renderer/components/PerCurrencySelectAccount/Option";
import { AccountTuple } from "~/renderer/components/PerCurrencySelectAccount/state";

type Option = {
  matched: boolean;
  account: Account;
  subAccount?: SubAccount | null;
};
const getOptionValue = (option: Option) => {
  return option.account ? option.account.id : "";
};
const defaultFilter = createFilter({
  stringify: ({ data: account }) => {
    const currency = getAccountCurrency(account);
    const name = getAccountName(account);
    return `${currency.ticker}|${currency.name}|${name}`;
  },
});
const filterOption = () => (candidate: unknown, input: string) => {
  const selfMatches = defaultFilter(candidate as ReactSelectOption, input);
  if (selfMatches) return [selfMatches, true];
  return [false, false];
};
const AccountOption = React.memo(function AccountOption({
  account,
  subAccount,
  isValue,
}: {
  account: Account;
  subAccount?: SubAccount;
  isValue?: boolean;
}) {
  return <MenuOption isValue={isValue} account={account} subAccount={subAccount} />;
});
type OwnProps = {
  value: AccountTuple;
  onChange: (account?: Account | null, subAccount?: SubAccount | null) => void;
  accounts: AccountTuple[];
};
type Props = {
  t: TFunction;
} & OwnProps;
const RawSelectAccount = ({ accounts, value, onChange, t, ...props }: Props) => {
  const [searchInputValue, setSearchInputValue] = useState("");
  const renderValue = ({ data }: { data: Option }) => {
    return data.account ? (
      <AccountOption account={data.account} subAccount={data.subAccount || undefined} isValue />
    ) : null;
  };
  const renderOption = ({ data }: { data: Option }) => {
    return data.account ? (
      <AccountOption account={data.account} subAccount={data.subAccount || undefined} />
    ) : null;
  };
  const onChangeCallback = useCallback(
    (option?: Option | null) => {
      if (option) {
        onChange(option.account, option.subAccount);
      } else {
        onChange(null, null);
      }
    },
    [onChange],
  );
  const manualFilter = useCallback(
    () =>
      accounts.reduce((result, option) => {
        const [display, match] = filterOption()(
          {
            data: option.account,
          },
          searchInputValue,
        );
        if (display) {
          result.push({
            matched: match,
            account: option.account,
            subAccount: option.subAccount,
          });
        }
        return result;
      }, [] as Option[]),
    [searchInputValue, accounts],
  );
  const structuredResults = manualFilter();
  return (
    <Select
      {...props}
      virtual={false}
      value={value as Option}
      options={structuredResults}
      getOptionValue={getOptionValue}
      renderValue={renderValue}
      renderOption={renderOption}
      onInputChange={(v: string) => setSearchInputValue(v)}
      inputValue={searchInputValue}
      filterOption={() => false}
      isOptionDisabled={(option: Option) => !option.matched}
      placeholder={t("common.selectAccount")}
      noOptionsMessage={({ inputValue }: { inputValue: string }) =>
        t("common.selectAccountNoOption", {
          accountName: inputValue,
        })
      }
      onChange={onChangeCallback}
    />
  );
};
export const SelectAccount = withTranslation()(RawSelectAccount);

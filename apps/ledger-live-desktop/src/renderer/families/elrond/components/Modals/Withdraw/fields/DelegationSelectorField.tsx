import React, { useMemo, useCallback, useState, useEffect } from "react";
import { BigNumber } from "bignumber.js";
import { denominate } from "@ledgerhq/live-common/families/elrond/helpers";
import Box from "~/renderer/components/Box";
import FirstLetterIcon from "~/renderer/components/FirstLetterIcon";
import Label from "~/renderer/components/Label";
import Select from "~/renderer/components/Select";
import Text from "~/renderer/components/Text";
import { TFunction } from "i18next";
import { AccountBridge } from "@ledgerhq/types-live";
import { ElrondProvider, Transaction } from "@ledgerhq/live-common/families/elrond/types";
import { UnbondingType } from "~/renderer/families/elrond/types";
import { Option as FilterOption } from "react-select/src/filters";

type NoOptionsMessageCallbackType = {
  inputValue: string;
};
type EnhancedUnbonding = UnbondingType & {
  disabled: boolean;
};
export interface Props {
  onChange: (validator: ElrondProvider) => void;
  onUpdateTransaction: (transaction: (_: Transaction) => Transaction) => void;
  bridge: AccountBridge<Transaction>;
  transaction?: Transaction;
  unbondings: UnbondingType[];
  contract?: string;
  amount?: string;
  t: TFunction;
}
const renderItem = (item: { data: EnhancedUnbonding }) => {
  const label = item.data.validator?.identity.name || item.data.contract;
  const balance = denominate({
    input: item.data.amount,
    decimals: 4,
  });
  return (
    <Box horizontal={true} alignItems="center" justifyContent="space-between">
      <Box horizontal={true} alignItems="center">
        <FirstLetterIcon label={label} />
        <Text ff="Inter|Medium">{label}</Text>
      </Box>

      <Text ff="Inter|Regular">
        {balance} {"EGLD"}
      </Text>
    </Box>
  );
};
const DelegationSelectorField = (props: Props) => {
  const { unbondings, amount, contract, t, onChange, bridge, transaction, onUpdateTransaction } =
    props;
  const options = useMemo(
    () =>
      unbondings?.reduce((total: Array<EnhancedUnbonding>, unbonding: UnbondingType) => {
        const current = Object.assign(unbonding, {
          disabled: unbonding.seconds > 0,
        });
        return unbonding.amount === amount && unbonding.contract === contract
          ? [current].concat(total)
          : total.concat([current]);
      }, []) || [],
    [unbondings, amount, contract],
  );
  const [query, setQuery] = useState("");
  const [value, setValue] = useState(options.find(() => true));
  const noOptionsMessageCallback = useCallback(
    (needle: NoOptionsMessageCallbackType): string =>
      t("common.selectValidatorNoOption", {
        accountName: needle.inputValue,
      }),
    [t],
  );
  const filterOptions = useCallback(
    (option: FilterOption, needle: string): boolean =>
      option.data.validator.identity.name
        ? option.data.validator.identity.name.toLowerCase().includes(needle.toLowerCase())
        : false,
    [],
  );
  const onValueChange = useCallback(
    // @ts-expect-error another amazing typing between this function, the one expected by Select
    // and the onChange we use here...
    option => {
      setValue(option);
      if (onChange) {
        onChange(option);
      }
    },
    [onChange],
  );
  useEffect(() => {
    const [defaultOption] = options;
    if (defaultOption && transaction && !transaction.recipient && transaction.amount.isEqualTo(0)) {
      onUpdateTransaction(transaction =>
        bridge.updateTransaction(transaction, {
          recipient: defaultOption.contract,
          amount: BigNumber(defaultOption.amount),
        }),
      );
    }
  }, [options, bridge, transaction, onUpdateTransaction]);
  return (
    <Box flow={1} mt={5}>
      <Label>{t("elrond.withdraw.flow.steps.withdraw.selectLabel")}</Label>

      <Select
        value={value}
        options={options}
        renderValue={renderItem}
        renderOption={renderItem}
        onInputChange={setQuery}
        inputValue={query}
        filterOption={filterOptions}
        placeholder={t("common.selectAccount")}
        noOptionsMessage={noOptionsMessageCallback}
        onChange={onValueChange}
        isOptionDisabled={option => option.disabled}
      />
    </Box>
  );
};
export default DelegationSelectorField;

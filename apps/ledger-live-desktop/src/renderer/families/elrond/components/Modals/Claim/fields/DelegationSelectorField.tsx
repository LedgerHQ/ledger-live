import React, { useMemo, useCallback, useState, useEffect } from "react";
import { BigNumber } from "bignumber.js";
import { denominate } from "@ledgerhq/live-common/families/elrond/helpers/denominate";
import Box from "~/renderer/components/Box";
import FirstLetterIcon from "~/renderer/components/FirstLetterIcon";
import Label from "~/renderer/components/Label";
import Select, { Option } from "~/renderer/components/Select";
import Text from "~/renderer/components/Text";
import { TFunction } from "react-i18next";
import { Transaction, AccountBridge } from "@ledgerhq/types-live";
import { ElrondProvider, DelegationType } from "~/renderer/families/elrond/types";
type NoOptionsMessageCallbackType = {
  inputValue: string;
};
type OptionType = ElrondProvider & {
  delegation: DelegationType | undefined;
};
interface DelegationSelectorFieldType {
  validators: Array<ElrondProvider>;
  delegations: Array<DelegationType>;
  contract: string;
  transaction: Transaction;
  onChange: (validator: ElrondProvider) => void;
  onUpdateTransaction: (transaction: Transaction) => void;
  t: TFunction;
  bridge: AccountBridge<Transaction>;
}
const renderItem = (item: Option) => {
  const name: string = item.data.identity.name || item.data.contract;
  const balance = denominate({
    input: item.data.delegation.claimableRewards,
    decimals: 4,
  });
  return (
    <Box horizontal={true} alignItems="center" justifyContent="space-between">
      <Box horizontal={true} alignItems="center">
        <FirstLetterIcon label={name} mr={2} />
        <Text ff="Inter|Medium">{name}</Text>
      </Box>

      <Text ff="Inter|Regular">
        {balance} {"EGLD"} {/* FIXME Should be getAccountUnit(account).code */}
      </Text>
    </Box>
  );
};
const DelegationSelectorField = (props: DelegationSelectorFieldType) => {
  const {
    validators,
    delegations,
    contract,
    t,
    onChange,
    bridge,
    transaction,
    onUpdateTransaction,
  } = props;
  const options = useMemo(
    (): Array<OptionType> =>
      validators.reduce((total, validator) => {
        const item: OptionType = {
          ...validator,
          delegation: delegations.find(
            delegation =>
              new BigNumber(delegation.claimableRewards).gt(0) &&
              delegation.contract === validator.contract,
          ),
        };
        return item.delegation
          ? contract && validator.contract === contract
            ? [item, ...total]
            : [...total, item]
          : total;
      }, []),
    [delegations, validators, contract],
  );
  const [query, setQuery] = useState<string>("");
  const [value, setValue] = useState<OptionType>(options.find(() => true));
  const noOptionsMessageCallback = useCallback(
    (needle: NoOptionsMessageCallbackType): string =>
      t("common.selectValidatorNoOption", {
        accountName: needle.inputValue,
      }),
    [t],
  );
  const filterOptions = useCallback(
    (option: Option, needle: string): boolean =>
      BigNumber(option.data.delegation.claimableRewards).gt(0) && option.data.identity.name
        ? option.data.identity.name.toLowerCase().includes(needle.toLowerCase())
        : false,
    [],
  );
  const onValueChange = useCallback(
    (option: OptionType) => {
      setValue(option);
      if (onChange) {
        onChange(option);
      }
    },
    [onChange],
  );
  useEffect(() => {
    const [defaultOption] = options;
    if (defaultOption && !transaction.recipient && transaction.amount.isEqualTo(0)) {
      onUpdateTransaction(
        (transaction: Transaction): Transaction =>
          bridge.updateTransaction(transaction, {
            recipient: defaultOption.delegation.contract,
            amount: BigNumber(defaultOption.delegation.claimableRewards),
          }),
      );
    }
  }, [options, bridge, transaction, onUpdateTransaction]);
  return (
    <Box flow={1} mt={5}>
      <Label>{t("elrond.claimRewards.flow.steps.claimRewards.selectLabel")}</Label>

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
      />
    </Box>
  );
};
export default DelegationSelectorField;

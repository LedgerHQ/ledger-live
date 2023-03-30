import React, { useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { denominate } from "@ledgerhq/live-common/families/elrond/helpers/denominate";
import FirstLetterIcon from "~/renderer/components/FirstLetterIcon";
import Box from "~/renderer/components/Box";
import Label from "~/renderer/components/Label";
import Select, { Option } from "~/renderer/components/Select";
import Text from "~/renderer/components/Text";
import { DelegationType, ElrondProvider } from "~/renderer/families/elrond/types";
type NoOptionsMessageCallbackType = {
  inputValue: string;
};
type OptionType = ElrondProvider & {
  delegation: DelegationType | undefined;
};
interface Props {
  delegations: Array<DelegationType>;
  onChange: (delegation: DelegationType) => void;
  contract: string;
}
const Item = (item: Option) => {
  const label: string = item.data.validator.identity.name || item.data.validator.contract;
  const amount = useMemo(
    () =>
      denominate({
        input: item.data.userActiveStake,
        decimals: 4,
      }),
    [item.data.userActiveStake],
  );
  return (
    <Box
      key={item.data.contract}
      horizontal={true}
      alignItems="center"
      justifyContent="space-between"
    >
      <Box horizontal={true} alignItems="center">
        <FirstLetterIcon label={label} mr={2} />
        <Text ff="Inter|Medium">{label}</Text>
      </Box>

      <Text ff="Inter|Regular">
        {amount} {"EGLD"} {/* FIXME Should be getAccountUnit(account).code */}
      </Text>
    </Box>
  );
};
const Dropdown = (props: Props) => {
  const { delegations, onChange, contract } = props;
  const { t } = useTranslation();
  const [defaultOption, ...options] = useMemo(
    (): Array<DelegationType> =>
      delegations.reduce(
        (total, delegation) =>
          delegation.contract === contract
            ? [delegation].concat(total)
            : total.concat([delegation]),
        [],
      ),
    [delegations, contract],
  );
  const [query, setQuery] = useState("");
  const [value, setValue] = useState(defaultOption);
  const noOptionsMessageCallback = useCallback(
    (needle: NoOptionsMessageCallbackType): string =>
      t("common.selectValidatorNoOption", {
        accountName: needle.inputValue,
      }),
    [t],
  );
  const filterOptions = useCallback(
    (option: Option, needle: string): boolean =>
      option.data.validator.identity.name
        ? option.data.validator.identity.name.toLowerCase().includes(needle.toLowerCase())
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
  return (
    <Box mb={4}>
      <Label>{t("elrond.undelegation.flow.steps.amount.fields.validator")}</Label>

      <Select
        value={value}
        options={[defaultOption].concat(options)}
        renderValue={Item}
        renderOption={Item}
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
export default Dropdown;

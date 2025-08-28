import React from "react";
import { useTranslation } from "react-i18next";
import { useSuiMappedStakingPositions } from "@ledgerhq/live-common/families/sui/react";
import { Transaction, SuiAccount, MappedStake } from "@ledgerhq/live-common/families/sui/types";
import LedgerValidatorIcon from "~/renderer/families/sui/shared/components/LedgerValidatorIcon";
import Box from "~/renderer/components/Box";
import Label from "~/renderer/components/Label";
import Select from "~/renderer/components/Select";
import Text from "~/renderer/components/Text";

type Props = {
  readonly account: SuiAccount;
  readonly transaction: Transaction;
  readonly onChange: (stakingPosition?: MappedStake | null) => void;
};
export default function ValidatorField({ account, transaction, onChange }: Props) {
  const { t } = useTranslation();
  const stakes = useSuiMappedStakingPositions(account);
  const stake = stakes.find(x => x.stakedSuiId === transaction.stakedSuiId);
  return (
    <Box mb={4}>
      <Label>{t("sui.unstake.flow.steps.amount.fields.validator")}</Label>
      <Select
        value={stake}
        options={stakes}
        renderOption={OptionRow}
        renderValue={OptionRow}
        onChange={onChange}
        isSearchable={false}
      />
    </Box>
  );
}
type OptionRowProps = {
  readonly data: MappedStake;
};
function OptionRow({ data: { validator, formattedAmount, stakedSuiId } }: OptionRowProps) {
  return (
    <Box key={stakedSuiId} horizontal alignItems="center" justifyContent="space-between">
      <Box horizontal alignItems="center">
        <LedgerValidatorIcon validator={validator} />
        <Text ml={2} ff="Inter|Medium">
          {validator.name}
        </Text>
      </Box>
      <Text ff="Inter|Regular">{formattedAmount}</Text>
    </Box>
  );
}

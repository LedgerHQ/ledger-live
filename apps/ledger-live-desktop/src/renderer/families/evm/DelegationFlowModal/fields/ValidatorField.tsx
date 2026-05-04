import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import Box from "~/renderer/components/Box";
import Input from "~/renderer/components/Input";
import Label from "~/renderer/components/Label";
import type { TransactionStatusCommon } from "@ledgerhq/types-live";

type Props = Readonly<{
  status: TransactionStatusCommon;
  onChangeValidator: (address: string) => void;
  chosenVoteAccAddr: string;
}>;

const ValidatorField = ({ onChangeValidator, chosenVoteAccAddr, status }: Props) => {
  const onChange = useCallback((value: string) => onChangeValidator(value), [onChangeValidator]);

  return (
    <Box flow={1}>
      <Label>
        <Trans i18nKey="delegation.validator" />
      </Label>
      <Input
        value={chosenVoteAccAddr}
        onChange={onChange}
        error={status.errors.valAddress}
        placeholder="Validator address"
      />
    </Box>
  );
};

export default ValidatorField;

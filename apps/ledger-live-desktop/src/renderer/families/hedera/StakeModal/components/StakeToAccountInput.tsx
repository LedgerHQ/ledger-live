// @flow

import React from "react";
import { TFunction, Trans } from "react-i18next";
import { RecipientRequired } from "@ledgerhq/errors";

import Label from "~/renderer/components/Label";
import RecipientAddress from "~/renderer/components/RecipientAddress";
import { Account } from "@ledgerhq/types-live";
import { TransactionStatus } from "@ledgerhq/live-common/generated/types";

type Props = {
  account: Account,
  status: TransactionStatus,
  value: string,
  onChange: () => void,
  t: TFunction,
};

const StakeToAccountInput = ({ account, status, value, onChange, t }: Props) => {
  if (!status) return null;
  const { stakeInput: stakeInputError } = status.errors;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "start",
        alignItems: "center",
        width: "420px"
      }}
    >
      <RecipientAddress
        placeholder={t("RecipientField.placeholder", { currencyName: account.currency.name })}
        withQrCode={false}
        error={stakeInputError instanceof RecipientRequired ? null : stakeInputError}
        value={value}
        onChange={onChange}
        id={"account-stake-input"}
        style={{ width: "390px" }}
      />
    </div>
  );
};

export default StakeToAccountInput;
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { StellarMemoType, Transaction } from "@ledgerhq/live-common/families/stellar/types";
import Select from "~/renderer/components/Select";
import { Account } from "@ledgerhq/types-live";

const options = StellarMemoType.map(type => ({
  label: type,
  value: type,
}));

const MemoTypeField = ({
  onChange,
  account,
  transaction,
}: {
  onChange: (t: Transaction) => void;
  account: Account;
  transaction: Transaction;
}) => {
  const bridge = getAccountBridge(account);
  const selectedMemoType =
    options.find(option => option.value === transaction.memoType) || options[0];
  const onMemoTypeChange = useCallback(
    // @ts-expect-error weird type here i cannot find the correct option
    memoType => {
      onChange(
        bridge.updateTransaction(transaction, {
          memoType: memoType.value,
        }),
      );
    },
    [onChange, bridge, transaction],
  );
  return (
    <div style={{ width: "156px" }}>
      <Select
        isSearchable={false}
        onChange={onMemoTypeChange}
        value={selectedMemoType}
        options={options}
        renderOption={({ data: { label } }) => (
          <Trans i18nKey={`families.stellar.memoType.${label}`} />
        )}
        renderValue={({ data: { label } }) => (
          <Trans i18nKey={`families.stellar.memoType.${label}`} />
        )}
      />
    </div>
  );
};
export default MemoTypeField;

import React, { useCallback } from "react";
import {
  SelectableAccount,
  SelectableAccountItem,
} from "../SelectableAccountItem/SelectableAccountItem";
import { VirtualList } from "../VirtualList/VirtualList";

export const SelectableAccountList = ({ accounts }: { accounts: SelectableAccount[] }) => {
  const renderItem = useCallback(
    (account: SelectableAccount) => (
      <SelectableAccountItem
        {...account}
        onToggle={() => {
          throw new Error("Function not implemented.");
        }}
      />
    ),
    [],
  );

  return <VirtualList items={accounts} itemHeight={64} renderItem={renderItem} gap={4} />;
};

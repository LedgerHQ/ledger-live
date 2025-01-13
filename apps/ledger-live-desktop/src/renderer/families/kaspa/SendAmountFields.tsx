import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { useFeesStrategy } from "@ledgerhq/live-common/families/kaspa/react";
import { Transaction } from "@ledgerhq/live-common/families/kaspa/types";
import React, { useCallback, useEffect } from "react";
import styled from "styled-components";
import SelectFeeStrategy, { OnClickType } from "~/renderer/components/SelectFeeStrategy";
import { context } from "~/renderer/drawers/Provider";

type Props = NonNullable<KaspaFamily["sendAmountFields"]>["component"];

const Separator = styled.div`
  width: 100%;
  height: 1px;
  background-color: ${p => p.theme.colors.palette.text.shade10};
  margin: 20px 0;
`;
const Fields: Props = ({
  transaction,
  account,
  parentAccount,
  onChange,
  status,
  updateTransaction,
  mapStrategies,
  trackProperties = {},
}) => {
  const bridge = getAccountBridge(account);
  const { state: drawerState, setDrawer } = React.useContext(context);

  const strategies = useFeesStrategy(account, transaction);

  useEffect(() => {
    updateTransaction((t: Transaction) =>
      bridge.updateTransaction(t, {
        rbf: true,
      }),
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onFeeStrategyClick = useCallback(
    ({ amount, feesStrategy }: OnClickType) => {
      updateTransaction((transaction: Transaction) =>
        bridge.updateTransaction(transaction, {
          feerate: amount,
          feesStrategy,
        }),
      );
      // if (drawerState.open) setDrawer(undefined);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [updateTransaction, bridge],
  );

  return (
    <>
      <SelectFeeStrategy
        strategies={strategies}
        onClick={onFeeStrategyClick}
        transaction={transaction}
        account={account}
        parentAccount={parentAccount}
        suffixPerByte={true}
        mapStrategies={mapStrategies}
        status={status}
      />
    </>
  );
};
export default {
  component: Fields,
  fields: ["feePerByte", "rbf"],
};

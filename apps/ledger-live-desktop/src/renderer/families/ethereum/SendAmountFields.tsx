import React, { useState, useCallback } from "react";
import {
  Transaction as EthereumTransaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/ethereum/types";
import { EIP1559ShouldBeUsed } from "@ledgerhq/live-common/families/ethereum/transaction";
import { useFeesStrategy } from "@ledgerhq/live-common/families/ethereum/react";
import { Account, AccountLike, AccountBridge } from "@ledgerhq/types-live";
import { Result } from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { context, ContextValue } from "~/renderer/drawers/Provider";
import SendFeeMode from "~/renderer/components/SendFeeMode";
import SelectFeeStrategy from "./SelectFeeStrategy";
import PriorityFeeField from "./PriorityFeeField";
import GasLimitField from "./GasLimitField";
import GasPriceField from "./GasPriceField";
import MaxFeeField from "./MaxFeeField";

type Props = {
  transaction: EthereumTransaction;
  account: AccountLike;
  parentAccount: Account | undefined;
  updateTransaction: Result<EthereumTransaction>["updateTransaction"];
  status: TransactionStatus;
};

const Root = (props: Props) => {
  const { account, parentAccount, updateTransaction, transaction } = props;
  const mainAccount = getMainAccount(account, parentAccount);
  const bridge: AccountBridge<EthereumTransaction> = getAccountBridge(mainAccount);
  const { state: drawerState, setDrawer } = React.useContext<ContextValue>(context);

  const defaultStrategies = useFeesStrategy(transaction);
  const [isAdvanceMode, setAdvanceMode] = useState(!transaction.feesStrategy);
  const strategies = defaultStrategies;

  const onFeeStrategyClick = useCallback(
    ({ amount, feesStrategy, extra }) => {
      updateTransaction(tx =>
        bridge.updateTransaction(tx, {
          gasPrice: amount,
          maxFeePerGas: extra?.maxFeePerGas,
          maxPriorityFeePerGas: extra?.maxPriorityFeePerGas,
          feesStrategy,
        }),
      );
      if (drawerState.open) setDrawer(undefined);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [updateTransaction, bridge],
  );

  return (
    <>
      <SendFeeMode isAdvanceMode={isAdvanceMode} setAdvanceMode={setAdvanceMode} />
      {isAdvanceMode ? (
        EIP1559ShouldBeUsed(mainAccount.currency) ? (
          <>
            <PriorityFeeField {...props} />
            <MaxFeeField {...props} />
            <GasLimitField {...props} />
          </>
        ) : (
          <>
            <GasPriceField {...props} />
            <GasLimitField {...props} />
          </>
        )
      ) : (
        <>
          <SelectFeeStrategy strategies={strategies} onClick={onFeeStrategyClick} {...props} />
        </>
      )}
    </>
  );
};

export default {
  component: Root,
  fields: ["feeStrategy", "gasLimit", "gasPrice"],
};

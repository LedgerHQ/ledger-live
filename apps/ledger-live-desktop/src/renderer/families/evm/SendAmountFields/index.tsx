import { EthereumLikeInfo } from "@ledgerhq/types-cryptoassets";
import { Transaction as EvmTransaction } from "@ledgerhq/coin-evm/types/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { useGasOptions } from "@ledgerhq/live-common/families/evm/react";
import { getCurrencyConfig } from "@ledgerhq/coin-evm/logic";
import { log } from "@ledgerhq/logs";
import { Box } from "@ledgerhq/react-ui";
import { AccountBridge } from "@ledgerhq/types-live";
import React, { useCallback, useEffect, useState } from "react";
import SendFeeMode from "~/renderer/components/SendFeeMode";
import { EvmFamily } from "../types";
import GasLimitField from "./GasLimitField";
import GasPriceField from "./GasPriceField";
import MaxFeeField from "./MaxFeeField";
import PriorityFeeField from "./PriorityFeeField";
import SelectFeeStrategy from "./SelectFeeStrategy";
import Spinner from "~/renderer/components/Spinner";

const Root: NonNullable<EvmFamily["sendAmountFields"]>["component"] = props => {
  const { account, updateTransaction, transaction } = props;
  const bridge: AccountBridge<EvmTransaction> = getAccountBridge(account);

  const [currencyConfig, setCurrencyConfig] = useState<Partial<EthereumLikeInfo> | null>(null);
  useEffect(() => {
    getCurrencyConfig(account.currency).then(setCurrencyConfig);
  }, [account.currency]);

  const [gasOptions, error] = useGasOptions({
    currency: account.currency,
    transaction,
    interval: account.currency.blockAvgTime ? account.currency.blockAvgTime * 1000 : undefined,
  });

  if (error) {
    log("SendAmountFields/index.tsx", error.message);
  }

  useEffect(() => {
    updateTransaction((tx: EvmTransaction) => bridge.updateTransaction(tx, { ...tx, gasOptions }));
  }, [bridge, updateTransaction, gasOptions]);

  const [isAdvanceMode, setAdvanceMode] = useState(false);

  const shouldUseEip1559 = transaction.type === 2;

  const onFeeStrategyClick = useCallback(
    ({ feesStrategy }) => {
      updateTransaction((tx: EvmTransaction) =>
        bridge.updateTransaction(tx, {
          feesStrategy,
        }),
      );
    },
    [updateTransaction, bridge],
  );

  if (!currencyConfig || (currencyConfig?.gasTracker && !gasOptions)) {
    return (
      <Box display="flex" justifyContent="center" mt={40}>
        <Spinner size={20} color="#BBB0FF" />
      </Box>
    );
  }

  /**
   * If no gasOptions available, this means this currency does not have a
   * gasTracker. Hence, we do not display the fee fields.
   */
  if (!gasOptions) {
    return null;
  }

  return (
    <>
      <SendFeeMode isAdvanceMode={isAdvanceMode} setAdvanceMode={setAdvanceMode} />
      {isAdvanceMode ? (
        shouldUseEip1559 ? (
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
          <SelectFeeStrategy gasOptions={gasOptions} onClick={onFeeStrategyClick} {...props} />
        </>
      )}
    </>
  );
};

export default {
  component: Root,
  fields: ["feeStrategy", "gasLimit", "gasPrice"],
};

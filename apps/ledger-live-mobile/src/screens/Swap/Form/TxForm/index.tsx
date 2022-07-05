import React from "react";
import { Flex } from "@ledgerhq/native-ui";
import {
  Account,
  CryptoCurrency,
  TokenCurrency,
} from "@ledgerhq/live-common/lib/types";
import {
  SwapTransactionType,
  ExchangeRate,
} from "@ledgerhq/live-common/lib/exchange/swap/types";
import { From } from "./From";
import { To } from "./To";

interface Props {
  swapTx: SwapTransactionType;
  provider?: string;
  accounts: Account[];
  currencies: (CryptoCurrency | TokenCurrency)[];
  exchangeRate?: ExchangeRate;
}

export function TxForm({
  swapTx,
  currencies,
  provider,
  accounts,
  exchangeRate,
}: Props) {
  return (
    <Flex>
      <From
        from={swapTx.swap.from}
        isMaxEnabled={swapTx.swap.isMaxEnabled}
        setAccount={swapTx.setFromAccount}
        setAmount={swapTx.setFromAmount}
        provider={provider}
        accounts={accounts}
      />
      <To
        to={swapTx.swap.to}
        amount={exchangeRate?.toAmount}
        setCurrency={swapTx.setToCurrency}
        provider={provider}
        currencies={currencies}
      />
    </Flex>
  );
}

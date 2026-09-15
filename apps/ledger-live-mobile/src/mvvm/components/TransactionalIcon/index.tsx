import React from "react";
import { DotIcon, getDotIconProps } from "@ledgerhq/lumen-ui-rnative";
import CryptoIcon from "@ledgerhq/crypto-icons/native";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { getTransactionalDotConfig } from "./getTransactionalDotConfig";
import type { OperationType } from "@ledgerhq/types-live";

export type TransactionalIconProps = {
  operationType: OperationType;
  isPending: boolean;
  hasFailed?: boolean;
  currency: CryptoCurrency | TokenCurrency;
  mediaSize?: Parameters<typeof getDotIconProps>[1];
};

function TransactionalIcon({
  operationType,
  isPending,
  hasFailed,
  currency,
  mediaSize = 48,
}: Readonly<TransactionalIconProps>) {
  const dot = getTransactionalDotConfig(operationType, isPending, hasFailed);
  const cryptoIcon = (
    <CryptoIcon
      testID={`transactional-icon-crypto-${currency.name.toLowerCase()}`}
      ledgerId={currency.id}
      ticker={currency.ticker}
      size={mediaSize}
    />
  );

  if (!dot) {
    return cryptoIcon;
  }

  return (
    <DotIcon
      testID={`transactional-icon-dot-${operationType}`}
      icon={dot.icon}
      appearance={dot.appearance}
      size={getDotIconProps("mediaImage", mediaSize).size}
      pin="top-end"
    >
      {cryptoIcon}
    </DotIcon>
  );
}

export default React.memo(TransactionalIcon);

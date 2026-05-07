import React from "react";
import { DotIcon, mediaImageDotIconSizeMap } from "@ledgerhq/lumen-ui-react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import type { TokenCurrency, CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { OperationType } from "@ledgerhq/types-live";
import { getValidCryptoIconSize } from "~/renderer/utils/cryptoIconSize";
import { getTransactionalDotConfig } from "./getTransactionalDotConfig";

export type TransactionalIconProps = {
  operationType: OperationType;
  isPending: boolean;
  hasFailed?: boolean;
  currency: CryptoCurrency | TokenCurrency;
  mediaSize?: keyof typeof mediaImageDotIconSizeMap;
  network?: string;
};

function TransactionalIcon({
  operationType,
  isPending,
  hasFailed,
  currency,
  mediaSize = 48,
  network,
}: Readonly<TransactionalIconProps>) {
  const dot = getTransactionalDotConfig(operationType, isPending, hasFailed);
  const cryptoIcon = (
    <CryptoIcon
      data-testid={`transactional-icon-crypto-${currency.name.toLowerCase()}`}
      ledgerId={currency.id}
      ticker={currency.ticker}
      size={getValidCryptoIconSize(mediaSize)}
      network={network}
    />
  );

  if (!dot) {
    return cryptoIcon;
  }

  return (
    <DotIcon
      data-testid={`transactional-icon-dot-${operationType}`}
      icon={dot.icon}
      appearance={dot.appearance}
      size={mediaImageDotIconSizeMap[mediaSize]}
      pin="top-end"
    >
      {cryptoIcon}
    </DotIcon>
  );
}

export default React.memo(TransactionalIcon);

import React from "react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import {
  TableCellContent,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@ledgerhq/lumen-ui-react";
import {
  MAX_VISIBLE_ACCOUNT_ASSETS,
  type AccountAssetCurrency,
} from "LLD/features/CryptoAddresses/utils/getAccountAssetsCurrencies";
import { getValidCryptoIconSize } from "~/renderer/utils/cryptoIconSize";
import useTheme from "~/renderer/hooks/useTheme";

const ICON_SIZE = getValidCryptoIconSize(20);
const ICON_OVERLAP_PX = 6;

type AccountAssetsCellProps = {
  readonly currencies: AccountAssetCurrency[];
};

export function AccountAssetsCell({ currencies }: AccountAssetsCellProps) {
  const theme = useTheme();
  const borderColor = theme.colors.background.card;

  if (currencies.length === 0) return null;

  const visibleCurrencies = currencies.slice(0, MAX_VISIBLE_ACCOUNT_ASSETS);
  const extraCount = currencies.length - visibleCurrencies.length;
  const assetTickers = currencies.map(currency => currency.ticker).join(", ");

  const stackWidth =
    visibleCurrencies.length * (ICON_SIZE - ICON_OVERLAP_PX) +
    ICON_OVERLAP_PX +
    (extraCount > 0 ? ICON_SIZE - ICON_OVERLAP_PX : 0);

  const iconStack = (
    <div
      className="relative flex h-5 items-center"
      style={{ width: stackWidth }}
      data-testid="account-assets-cell"
    >
      {visibleCurrencies.map((currency, index) => (
        <div
          key={`${currency.id}-${index}`}
          className="absolute box-border rounded-full"
          style={{
            left: index * (ICON_SIZE - ICON_OVERLAP_PX),
            width: ICON_SIZE,
            height: ICON_SIZE,
            border: `1px solid ${borderColor}`,
          }}
        >
          <CryptoIcon
            ledgerId={currency.id}
            ticker={currency.ticker}
            size={ICON_SIZE}
            {...(currency.type === "TokenCurrency" && {
              network: currency.parentCurrency.id,
            })}
          />
        </div>
      ))}
      {extraCount > 0 && (
        <div
          className="absolute flex items-center justify-center rounded-full bg-muted text-xs font-medium text-default"
          style={{
            left: visibleCurrencies.length * (ICON_SIZE - ICON_OVERLAP_PX),
            width: ICON_SIZE,
            height: ICON_SIZE,
            border: `1px solid ${borderColor}`,
          }}
          data-testid="account-assets-overflow"
        >
          +{extraCount}
        </div>
      )}
    </div>
  );

  return (
    <TableCellContent
      leadingContent={
        <Tooltip>
          <TooltipTrigger asChild>{iconStack}</TooltipTrigger>
          <TooltipContent>{assetTickers}</TooltipContent>
        </Tooltip>
      }
    />
  );
}

import React, { useCallback, useMemo } from "react";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { BigNumber } from "bignumber.js";
import isEqual from "lodash/isEqual";
import { GestureResponderEvent } from "react-native";

import { usePortfolioForAccounts } from "~/hooks/portfolio";
import AssetRowLayout from "~/components/AssetRowLayout";
import { track } from "~/analytics";
import { Asset } from "~/types/asset";
import { useAssetDetailNavigation } from "LLM/features/AssetDetail/hooks/useAssetDetailNavigation";

type Props = {
  asset: Asset;
  hideDelta?: boolean;
  topLink?: boolean;
  bottomLink?: boolean;
};

const AssetRow = ({ asset, hideDelta, topLink, bottomLink }: Props) => {
  // makes it refresh if this changes
  useEnv("HIDE_EMPTY_TOKEN_ACCOUNTS");
  const currency = asset.currency;
  const name = currency.name;
  const unit = currency.units[0];
  const { openFromAsset } = useAssetDetailNavigation();

  // TODO: implement a much lighter hook to get this simple value
  const { countervalueChange } = usePortfolioForAccounts(asset.accounts);

  const onAssetPress = useCallback(
    (_uiEvent: GestureResponderEvent) => {
      track("asset_clicked", {
        asset: currency.name,
      });

      openFromAsset({
        currency,
        source: "wallet_centric_asset",
        isPlaceholder: asset.isPlaceholder,
        marketId: asset.marketId,
      });
    },
    [currency, asset.isPlaceholder, asset.marketId, openFromAsset],
  );

  /**
   * Avoid passing a new object to AssetRowLayout if the value didn't actually
   * change.
   * Not a small optimisation as that component can take several milliseconds to
   * render, and it's meant to be rendered in a list.
   *  */
  const balance = useMemo(() => BigNumber(asset.amount), [asset.amount]);

  return (
    <AssetRowLayout
      onPress={onAssetPress}
      currency={currency}
      currencyUnit={unit}
      balance={balance}
      name={name}
      countervalueChange={countervalueChange}
      topLink={topLink}
      bottomLink={bottomLink}
      hideDelta={hideDelta}
    />
  );
};

export default React.memo(
  AssetRow,
  /**
   * Here we need a deep compare for the `asset` prop in particular.
   * We want to avoid recomputing usePortfolioForAccounts if the accounts value
   * did not change.
   * (That portfolio computation can take several milliseconds ~4ms for instance
   * on a performant device, in __DEV__ mode). Since it's meant to be rendered
   * in a list, this is not a small optimisation.
   */
  (prevProps, newProps) => isEqual(prevProps, newProps),
);

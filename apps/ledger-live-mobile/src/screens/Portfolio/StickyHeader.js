// @flow

import React from "react";
import { useSelector } from "react-redux";
import type { Currency } from "@ledgerhq/types-cryptoassets";
import type { Portfolio } from "@ledgerhq/types-live";
import { useGlobalSyncState } from "@ledgerhq/live-common/bridge/react/index";
import { isUpToDateSelector } from "../../reducers/accounts";
import { networkErrorSelector } from "../../reducers/appstate";
import AnimatedTopBar from "./AnimatedTopBar";

type Props = {
  portfolio: Portfolio,
  counterValueCurrency: Currency,
  scrollY: any,
};

export default function StickyHeader({
  scrollY,
  counterValueCurrency,
  portfolio,
}: Props) {
  const isUpToDate = useSelector(isUpToDateSelector);
  const networkError = useSelector(networkErrorSelector);
  const globalSyncState = useGlobalSyncState();

  return (
    <AnimatedTopBar
      scrollY={scrollY}
      portfolio={portfolio}
      counterValueCurrency={counterValueCurrency}
      pending={globalSyncState.pending && !isUpToDate}
      error={
        isUpToDate || !globalSyncState.error
          ? null
          : networkError || globalSyncState.error
      }
    />
  );
}

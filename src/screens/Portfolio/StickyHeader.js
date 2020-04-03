// @flow

import React from "react";
import { useSelector } from "react-redux";
import type { Portfolio, Currency } from "@ledgerhq/live-common/lib/types";
import { useGlobalSyncState } from "@ledgerhq/live-common/lib/bridge/react";
import AnimatedTopBar from "./AnimatedTopBar";
import { isUpToDateSelector } from "../../reducers/accounts";
import { networkErrorSelector } from "../../reducers/appstate";

type Props = {
  portfolio: Portfolio,
  counterValueCurrency: Currency,
  scrollY: *,
  navigation: *,
};

const StickyHeader = ({
  scrollY,
  counterValueCurrency,
  portfolio,
  navigation,
}: Props) => {
  const isUpToDate = useSelector(isUpToDateSelector);
  const networkError = useSelector(networkErrorSelector);
  const globalSyncState = useGlobalSyncState();
  return (
    <AnimatedTopBar
      scrollY={scrollY}
      portfolio={portfolio}
      navigation={navigation}
      counterValueCurrency={counterValueCurrency}
      pending={globalSyncState.pending && !isUpToDate}
      error={
        isUpToDate || !globalSyncState.error
          ? null
          : networkError || globalSyncState.error
      }
    />
  );
};

export default StickyHeader;

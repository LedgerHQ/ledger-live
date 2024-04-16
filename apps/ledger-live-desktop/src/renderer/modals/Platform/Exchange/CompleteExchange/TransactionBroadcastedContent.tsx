import React from "react";
import { Trans } from "react-i18next";
import { SwapSelectorStateType } from "@ledgerhq/live-common/exchange/swap/types";
import Box from "~/renderer/components/Box";
import { Separator } from "~/renderer/screens/exchange/Swap2/Form/Separator";
import Button from "~/renderer/components/Button";
import SwapCompleted from "~/renderer/screens/exchange/Swap2/Form/ExchangeDrawer/SwapCompleted";
import { useGetSwapTrackingProperties } from "~/renderer/screens/exchange/Swap2/utils";
import TrackPage from "~/renderer/analytics/TrackPage";

type TransactionBroadcastedContentProps = {
  swapId: string;
  provider: string;
  sourceCurrency: SwapSelectorStateType["currency"];
  targetCurrency: SwapSelectorStateType["currency"];
  onViewDetails: (id: string) => void;
};

export function TransactionBroadcastedContent(props: TransactionBroadcastedContentProps) {
  const { swapId, provider, sourceCurrency, targetCurrency, onViewDetails } = props;

  const swapDefaultTrack = useGetSwapTrackingProperties();
  return (
    <Box height="100%" justifyContent="space-between" paddingTop={62} paddingBottom={15}>
      <TrackPage
        category="Swap"
        name={`ModalStep-finished`}
        sourceCurrency={sourceCurrency?.name}
        targetCurrency={targetCurrency?.name}
        provider={provider}
        {...swapDefaultTrack}
      />
      {targetCurrency && (
        <Box justifyContent="center" flex={1}>
          <SwapCompleted swapId={swapId} provider={provider} targetCurrency={targetCurrency.name} />
        </Box>
      )}
      <Box flex={0}>
        <Separator noMargin />
        <Box
          style={{
            flexDirection: "row-reverse",
          }}
          pt={16}
        >
          <Button primary onClick={() => onViewDetails(swapId)}>
            <Trans i18nKey="swap2.exchangeDrawer.completed.seeDetails" />
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

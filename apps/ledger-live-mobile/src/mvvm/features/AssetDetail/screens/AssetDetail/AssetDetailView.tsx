import React from "react";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { TrackScreen } from "~/analytics";
import SafeAreaView from "~/components/SafeAreaView";

type Props = {
  currency: CryptoCurrency | undefined;
  source?: string;
};

export function AssetDetailView({ currency, source }: Props) {
  return (
    <SafeAreaView edges={["left", "right", "bottom"]} isFlex>
      <TrackScreen category="Asset" currency={currency?.name} source={source} />
      <Box lx={{ flex: 1 }} />
    </SafeAreaView>
  );
}

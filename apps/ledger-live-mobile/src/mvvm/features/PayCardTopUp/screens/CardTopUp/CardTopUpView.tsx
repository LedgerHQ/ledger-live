import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { CardTopUpAmountView } from "@features/flow-pay-card-top-up";
import { CardTopUpSign } from "./components/CardTopUpSign";
import type { CardTopUpViewModel } from "./useCardTopUpViewModel";

export function CardTopUpView({ sign, ...amountView }: CardTopUpViewModel) {
  const styles = useStyleSheet(
    theme => ({
      root: {
        flex: 1,
        backgroundColor: theme.colors.bg.base,
      },
    }),
    [],
  );

  return (
    <SafeAreaView edges={["bottom"]} style={styles.root}>
      <CardTopUpAmountView {...amountView} />
      <CardTopUpSign {...sign} />
    </SafeAreaView>
  );
}

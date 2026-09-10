import React from "react";
import { PaySuccess } from "@features/flow-pay-contact";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import SafeAreaView from "~/components/SafeAreaView";
import { usePaySuccessViewModel } from "./usePaySuccessViewModel";

export function PaySuccessScreen() {
  const viewModel = usePaySuccessViewModel();
  const styles = useStyleSheet(
    theme => ({
      container: {
        flex: 1,
        backgroundColor: theme.colors.bg.base,
      },
    }),
    [],
  );

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
      <PaySuccess {...viewModel} />
    </SafeAreaView>
  );
}

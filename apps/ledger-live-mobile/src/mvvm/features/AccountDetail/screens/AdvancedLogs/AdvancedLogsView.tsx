import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import {
  AdvancedLogsContent,
  type AdvancedLogsInput,
} from "@features/flow-account-detail-settings";
import SafeAreaView from "~/components/SafeAreaView";
import { ACCOUNT_DETAIL_TEST_IDS } from "../../testIds";

type Props = Readonly<{
  input: AdvancedLogsInput;
  locale: string;
  derivationTag: string | undefined;
}>;

export function AdvancedLogsView({ input, locale, derivationTag }: Props) {
  return (
    <SafeAreaView edges={["bottom"]} isFlex testID={ACCOUNT_DETAIL_TEST_IDS.advancedLogsScreen}>
      <Box lx={contentStyle}>
        <AdvancedLogsContent input={input} locale={locale} derivationTag={derivationTag} />
      </Box>
    </SafeAreaView>
  );
}

const contentStyle: LumenViewStyle = {
  flex: 1,
  paddingHorizontal: "s16",
  paddingTop: "s8",
};

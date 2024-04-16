import React from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import AnimatedCountdown from "~/renderer/components/AnimatedCountdown";
import { formatCountdown } from "~/renderer/screens/exchange/Swap2/Form/Rates/utils/formatCountdown";
import { DEFAULT_SWAP_RATES_INTERVAL_MS } from "@ledgerhq/live-common/exchange/swap/const/timeout";

export type Props = {
  countdown: number;
};

const CountdownText = styled(Text)`
  color: ${p => p.theme.colors.neutral.c70};
`;

export default function Countdown({ countdown }: Props) {
  return (
    <>
      {countdown >= 0 ? (
        <Box horizontal fontSize={3}>
          <CountdownText>
            <Trans i18nKey="swap2.form.rates.update" />
          </CountdownText>
          <Box horizontal fontSize={3} mx={1} key={1}>
            <AnimatedCountdown size={15} duration={DEFAULT_SWAP_RATES_INTERVAL_MS} />
          </Box>
          <Box
            color="neutral.c100"
            style={{
              width: "28px",
            }}
          >
            {formatCountdown(countdown)}
          </Box>
        </Box>
      ) : (
        <CountdownText>
          <Trans i18nKey="swap2.form.rates.loading" />
        </CountdownText>
      )}
    </>
  );
}

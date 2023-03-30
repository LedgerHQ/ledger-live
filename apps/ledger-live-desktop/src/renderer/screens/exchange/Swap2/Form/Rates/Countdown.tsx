import React, { useEffect, useState } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import { RatesReducerState } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import AnimatedCountdown from "~/renderer/components/AnimatedCountdown";
import { formatCountdown } from "~/renderer/screens/exchange/Swap2/Form/Rates/utils/formatCountdown";
export type Props = {
  rates: RatesReducerState["value"];
  refreshTime: number;
};
const CountdownText: ThemedComponent<{}> = styled(Text)`
  color: ${p => p.theme.colors.neutral.c70};
`;
export default function Countdown({ refreshTime, rates }: Props) {
  const getSeconds = time => Math.round(time / 1000);
  const [countdown, setCountdown] = useState(getSeconds(refreshTime));
  const [iconKey, setIconKey] = useState(0);
  useEffect(() => {
    setIconKey(key => key + 1);
    const startTime = new Date().getTime();
    setCountdown(getSeconds(refreshTime));
    const countdownInterval = setInterval(() => {
      const now = new Date().getTime();
      const newCountdown = refreshTime + startTime - now;
      setCountdown(getSeconds(newCountdown));
    }, 1000);
    return () => {
      clearInterval(countdownInterval);
    };
  }, [rates, refreshTime]);
  return (
    <>
      {countdown >= 0 ? (
        <Box horizontal fontSize={3}>
          <CountdownText>
            <Trans i18nKey="swap2.form.rates.update" />
          </CountdownText>
          <Box horizontal fontSize={3} mx={1} key={iconKey}>
            <AnimatedCountdown size={15} duration={refreshTime} />
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

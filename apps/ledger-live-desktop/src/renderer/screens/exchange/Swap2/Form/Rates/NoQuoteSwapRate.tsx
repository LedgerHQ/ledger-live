import React from "react";
import { Text } from "@ledgerhq/react-ui";
import styled from "styled-components";
import { ExchangeRate } from "@ledgerhq/live-common/exchange/swap/types";
import { ThemedComponent } from "~/renderer/styles/StyleProvider";
import { Trans } from "react-i18next";
import Rate from "./Rate";
import { getProviderName } from "@ledgerhq/live-common/exchange/swap/utils/index";
export type Props = {
  value?: ExchangeRate;
  onSelect: (a: ExchangeRate) => void;
  selected?: boolean;
  icon?: string;
};
const SecondaryText: ThemedComponent<{}> = styled(Text)`
  color: ${p => p.theme.colors.neutral.c70};
`;
function NoQuoteSwapRate({ value = {}, selected, onSelect, icon }: Props) {
  return (
    <Rate
      value={value}
      selected={selected}
      onSelect={onSelect}
      icon={icon}
      title={getProviderName(value.provider)}
      subtitle={<Trans i18nKey={"swap2.form.rates.noRegistration"} />}
      rightContainer={
        <SecondaryText
          fontSize={3}
          style={{
            width: "110px",
            textAlign: "right",
          }}
        >
          <Trans i18nKey={"swap.providers.noQuote"} />
        </SecondaryText>
      }
    ></Rate>
  );
}
export default React.memo<Props>(NoQuoteSwapRate);

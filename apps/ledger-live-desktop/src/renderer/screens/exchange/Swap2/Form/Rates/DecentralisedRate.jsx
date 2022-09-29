// @flow
import React from "react";
import { Text } from "@ledgerhq/react-ui";
import styled from "styled-components";
import type { ExchangeRate } from "@ledgerhq/live-common/exchange/swap/types";
import type { ThemedComponent } from "~/renderer/styles/StyleProvider";
import { Trans } from "react-i18next";
import Rate from "./Rate";

export type Props = {
  value?: ExchangeRate,
  onSelect: ExchangeRate => void,
  selected?: boolean,
  icon?: string,
};

const SecondaryText: ThemedComponent<{}> = styled(Text)`
  color: ${p => p.theme.colors.neutral.c70};
`;

function DecentralisedRate({ value = {}, selected, onSelect, icon }: Props) {
  return (
    <Rate
      value={value}
      selected={selected}
      onSelect={onSelect}
      icon={icon}
      title={value.name}
      subtitle={<Trans i18nKey={"swap2.form.rates.noRegistration"} />}
      rightContainer={
        <SecondaryText fontSize={3} style={{ width: "110px", textAlign: "right" }}>
          <Trans i18nKey={"swap.providers.noQuote"} />
        </SecondaryText>
      }
    ></Rate>
  );
}

export default React.memo<Props>(DecentralisedRate);

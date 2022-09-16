// @flow
import React from "react";
import Text from "~/renderer/components/Text";
import type { ExchangeRate } from "@ledgerhq/live-common/exchange/swap/types";
import { Trans } from "react-i18next";
import Rate from "./Rate";

export type Props = {
  value?: ExchangeRate,
  onSelect: ExchangeRate => void,
  selected?: boolean,
  icon?: string,
};

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
        <Text
          fontSize={3}
          color="palette.text.shade40"
          style={{ width: "110px", textAlign: "right" }}
        >
          <Trans i18nKey={"swap.providers.noQuote"} />
        </Text>
      }
    ></Rate>
  );
}

export default React.memo<Props>(DecentralisedRate);

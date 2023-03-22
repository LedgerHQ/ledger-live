// @flow

import React from "react";
import { Trans } from "react-i18next";

import Text from "~/renderer/components/Text";
import RadioGroup from "~/renderer/components/RadioGroup";

type Item = {
  label: React$Node,
  key: string,
};

type Props = {
  items: Array<Item>,
  activeKey: string,
  onChange: () => void,
};

const StakeMethodSelect = ({ items, activeKey, onChange }: Props) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "start",
        alignItems: "center",
        marginBottom: 30,
      }}
    >
      <Text style={{ marginRight: 10 }}>
        <Trans i18nKey="hedera.stake.flow.stake.to" />
      </Text>
      <RadioGroup items={items} activeKey={activeKey} onChange={onChange} />
    </div>
  );
};

export default StakeMethodSelect;
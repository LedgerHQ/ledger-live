// @flow

import React from "react";
import { Trans } from "react-i18next";

import Label from "~/renderer/components/Label";
import Select from "~/renderer/components/Select";

import type { Option } from "~/renderer/components/Select";

type Props = { selected: string, nodeListOptions: Option[] | null, onChange: () => void };

const StakeToNodeSelect = ({ selected, nodeListOptions, onChange }: Props) => {
  if (selected) {
    selected = nodeListOptions.find((node: Option) => node.value === selected);
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "start",
        alignItems: "center",
      }}
    >
      <Label style={{ marginRight: 10 }}>
        <Trans i18nKey="hedera.common.node" />
      </Label>
      <Select
        width={275}
        value={selected}
        options={nodeListOptions}
        onChange={onChange}
        isDisabled={nodeListOptions.length === 0}
      />
    </div>
  );
};

export default StakeToNodeSelect;
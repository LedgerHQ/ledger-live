// @flow

import React from "react";
import { Trans } from "react-i18next";

import CheckBox from "~/renderer/components/CheckBox";
import Label from "~/renderer/components/Label";

type Props = {
  isChecked: boolean,
  onChange: () => void,
};

const DeclineRewardsCheckBox = ({ isChecked, onChange }: Props) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "start",
        alignItems: "center",
      }}
    >
      <CheckBox style={{ marginRight: 8 }} isChecked={isChecked} onChange={onChange} />
      <Label>
        <Trans i18nKey="hedera.stake.flow.stake.declineRewards" />
      </Label>
    </div>
  );
};

export default DeclineRewardsCheckBox;
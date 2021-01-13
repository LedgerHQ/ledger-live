/* @flow */

import React, { memo } from "react";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import ModalBottomAction from "./ModalBottomAction";
import Trash from "../icons/Trash";
import Circle from "./Circle";

// FIXME this is not a modal \o/
function HardResetModal() {
  const { colors } = useTheme();
  return (
    <ModalBottomAction
      title={null}
      icon={
        <Circle bg={colors.lightAlert} size={56}>
          <Trash size={24} color={colors.alert} />
        </Circle>
      }
      description={<Trans i18nKey="reset.description" />}
      footer={null}
    />
  );
}

export default memo(HardResetModal);

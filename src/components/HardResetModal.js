/* @flow */

import React, { PureComponent } from "react";
import { Trans } from "react-i18next";

import colors from "../colors";
import ModalBottomAction from "./ModalBottomAction";
import Trash from "../icons/Trash";
import Circle from "./Circle";

type Props = {};

// FIXME this is not a modal \o/
class HardResetModal extends PureComponent<Props> {
  render() {
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
}

export default HardResetModal;

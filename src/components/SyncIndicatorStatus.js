// @flow

import React, { Component } from "react";
import { Trans } from "react-i18next";
import LText from "./LText";
import Touchable from "./Touchable";

export default class SyncIndicatorStatus extends Component<*> {
  render() {
    const { isUpToDate, onPress } = this.props;
    return (
      <Touchable event="SyncIndicatorStatus" onPress={onPress}>
        <LText numberOfLines={1}>
          <Trans i18nKey={`common.${isUpToDate ? "upToDate" : "outdated"}`} />
        </LText>
      </Touchable>
    );
  }
}

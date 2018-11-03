/* @flow */
import React, { Component } from "react";
import { translate, Trans } from "react-i18next";
import Button from "./Button";

class CancelButton extends Component<*> {
  render() {
    return (
      <Button
        type="secondary"
        title={<Trans i18nKey="common.cancel" />}
        {...this.props}
      />
    );
  }
}

export default translate()(CancelButton);

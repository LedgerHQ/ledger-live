import React, { Component } from "react";
import { Trans } from "react-i18next";
import Button from "./Button";

class CancelButton extends Component<any> {
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

export default CancelButton;

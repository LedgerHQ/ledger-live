/* @flow */
import React, { Component } from "react";
import { translate, Trans } from "react-i18next";
import Button from "./Button";

class ContactUsButton extends Component<*> {
  render() {
    return (
      <Button
        type="secondary"
        title={<Trans i18nKey="common.contactUs" />}
        onPress={() => {}} // TODO do something
        {...this.props}
      />
    );
  }
}

export default translate()(ContactUsButton);

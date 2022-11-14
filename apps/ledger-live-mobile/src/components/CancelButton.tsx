import React, { Component } from "react";
import { Trans } from "react-i18next";
import Button from "./Button";

type Props = Omit<React.ComponentProps<typeof Button>, "type" | "title">;

class CancelButton extends Component<Props> {
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

import React, { Component } from "react";
import { Trans } from "react-i18next";
import { Link, Text } from "@ledgerhq/native-ui";

class CancelButton extends Component {
  render() {
    return (
      <Link type="main">
        <Text variant="body" color="neutral.c100" fontSize={5}>
          <Trans i18nKey="common.cancel" />
        </Text>
      </Link>
    );
  }
}

export default CancelButton;

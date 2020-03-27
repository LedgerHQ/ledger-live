// @flow

import React, { PureComponent } from "react";
import { Trans } from "react-i18next";

import SettingsRow from "../../../components/SettingsRow";
import InfoModal from "../../../components/InfoModal";

type Props = {|
  borderTop?: boolean,
|};

type State = {
  isOpened: boolean,
};

class TechnicalDataRow extends PureComponent<Props, State> {
  state = {
    isOpened: false,
  };

  onClose = () => this.setState({ isOpened: false });
  onOpen = () => this.setState({ isOpened: true });

  render() {
    const { ...props } = this.props;
    const { isOpened } = this.state;
    return (
      <>
        <SettingsRow
          event="TechnicalDataRow"
          title={<Trans i18nKey="settings.display.technicalData" />}
          desc={<Trans i18nKey="settings.display.technicalDataDesc" />}
          onHelpPress={this.onOpen}
          {...props}
        />
        <InfoModal
          id="TechnicalDataModal"
          isOpened={isOpened}
          onClose={this.onClose}
          title={<Trans i18nKey="settings.display.technicalDataModal.title" />}
          desc={<Trans i18nKey="settings.display.technicalDataModal.desc" />}
          bullets={[
            {
              key: "bullet1",
              val: (
                <Trans i18nKey="settings.display.technicalDataModal.bullet1" />
              ),
            },
            {
              key: "bullet2",
              val: (
                <Trans i18nKey="settings.display.technicalDataModal.bullet2" />
              ),
            },
          ]}
        />
      </>
    );
  }
}

export default TechnicalDataRow;

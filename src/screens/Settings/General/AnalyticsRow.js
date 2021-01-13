/* @flow */
import React, { PureComponent } from "react";
import FeatherIcon from "react-native-vector-icons/dist/Feather";
import { connect } from "react-redux";
import { Trans } from "react-i18next";
import { createStructuredSelector } from "reselect";
import { useTheme } from "@react-navigation/native";
import SettingsRow from "../../../components/SettingsRow";
import { setAnalytics } from "../../../actions/settings";
import { analyticsEnabledSelector } from "../../../reducers/settings";
import InfoModal from "../../../components/InfoModal";
import Track from "../../../analytics/Track";
import Switch from "../../../components/Switch";

type Props = {
  analyticsEnabled: boolean,
  setAnalytics: boolean => void,
};

type State = {
  isOpened: boolean,
};

const mapStateToProps = createStructuredSelector({
  analyticsEnabled: analyticsEnabledSelector,
});

const mapDispatchToProps = {
  setAnalytics,
};

const IconActivity = () => {
  const { colors } = useTheme();
  return <FeatherIcon name="activity" size={32} color={colors.live} />;
};

class AnalyticsRow extends PureComponent<Props, State> {
  state = {
    isOpened: false,
  };

  onOpen = () => this.setState({ isOpened: true });
  onClose = () => this.setState({ isOpened: false });

  render() {
    const { analyticsEnabled, setAnalytics } = this.props;
    const { isOpened } = this.state;
    return (
      <>
        <Track
          event={analyticsEnabled ? "EnableAnalytics" : "DisableAnalytics"}
          mandatory
          onUpdate
        />
        <SettingsRow
          event="AnalyticsRow"
          title={<Trans i18nKey="settings.display.analytics" />}
          desc={<Trans i18nKey="settings.display.analyticsDesc" />}
          onPress={null}
          onHelpPress={this.onOpen}
          alignedTop
        >
          <Switch
            style={{ opacity: 0.99 }}
            value={analyticsEnabled}
            onValueChange={setAnalytics}
          />
        </SettingsRow>
        <InfoModal
          id="AnalyticsModal"
          Icon={IconActivity}
          isOpened={isOpened}
          onClose={this.onClose}
          title={<Trans i18nKey="settings.display.analyticsModal.title" />}
          desc={<Trans i18nKey="settings.display.analyticsModal.desc" />}
          bullets={[
            {
              key: "bullet0",
              val: <Trans i18nKey="settings.display.analyticsModal.bullet0" />,
            },
            {
              key: "bullet1",
              val: <Trans i18nKey="settings.display.analyticsModal.bullet1" />,
            },
            {
              key: "bullet2",
              val: <Trans i18nKey="settings.display.analyticsModal.bullet2" />,
            },
            {
              key: "bullet3",
              val: <Trans i18nKey="settings.display.analyticsModal.bullet3" />,
            },
            {
              key: "bullet4",
              val: <Trans i18nKey="settings.display.analyticsModal.bullet4" />,
            },
            {
              key: "bullet5",
              val: <Trans i18nKey="settings.display.analyticsModal.bullet5" />,
            },
            {
              key: "bullet6",
              val: <Trans i18nKey="settings.display.analyticsModal.bullet6" />,
            },
            {
              key: "bullet7",
              val: <Trans i18nKey="settings.display.analyticsModal.bullet7" />,
            },
            {
              key: "bullet8",
              val: <Trans i18nKey="settings.display.analyticsModal.bullet8" />,
            },
          ]}
        />
      </>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AnalyticsRow);

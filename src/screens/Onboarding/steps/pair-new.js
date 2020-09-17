// @flow

import React, { Component } from "react";
import { Linking } from "react-native";

import type { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import connectManager from "@ledgerhq/live-common/lib/hw/connectManager";
import { createAction } from "@ledgerhq/live-common/lib/hw/actions/manager";
import { compose } from "redux";
import { connect } from "react-redux";
import { TrackScreen } from "../../../analytics";
import { ScreenName } from "../../../const";
import Button from "../../../components/Button";
import SelectDevice from "../../../components/SelectDevice";
import OnboardingLayout from "../OnboardingLayout";
import { withOnboardingContext } from "../onboardingContext";
import { urls } from "../../../config/urls";

import { installAppFirstTime } from "../../../actions/settings";

import DeviceActionModal from "../../../components/DeviceActionModal";

import type { OnboardingStepProps } from "../types";

const action = createAction(connectManager);

class OnboardingStepPairNew extends Component<
  OnboardingStepProps & { installAppFirstTime: (value: boolean) => void },
  { device?: Device },
> {
  state = { device: undefined };
  Footer = () =>
    __DEV__ ? (
      <Button
        event="OnboardingPairSkip"
        type="lightSecondary"
        title="(DEV) skip this step"
        onPress={this.props.next}
      />
    ) : null;

  help = () => Linking.openURL(urls.faq);

  pairNew = () => this.props.navigation.navigate(ScreenName.PairDevices);

  onSelectDevice = (device?: Device) => {
    this.setState({ device });
  };

  onSelect = (info: any) => {
    /** if list apps succeed we update settings with state of apps installed */
    if (info) {
      const hasAnyAppinstalled =
        info.result &&
        info.result.installed &&
        info.result.installed.length > 0;

      this.props.installAppFirstTime(hasAnyAppinstalled);
    }
    this.setState({ device: undefined }, () => this.props.next(info));
  };

  render() {
    const { deviceModelId, t } = this.props;
    const usbOnly = ["nanoS", "blue"].includes(deviceModelId);

    const { device } = this.state;

    return (
      <OnboardingLayout
        header="OnboardingStepPairNew"
        Footer={this.Footer}
        borderedFooter
        noTopPadding
        withNeedHelp
        titleOverride={
          usbOnly
            ? t(`onboarding.stepsTitles.OnboardingStepConnectNew`)
            : undefined
        }
      >
        <TrackScreen category="Onboarding" name="PairNew" />
        <SelectDevice
          withArrows
          usbOnly={usbOnly}
          deviceModelId={deviceModelId}
          onSelect={usbOnly ? this.onSelectDevice : this.props.next}
          autoSelectOnAdd
        />
        <DeviceActionModal
          onClose={this.onSelectDevice}
          device={device}
          onResult={this.onSelect}
          action={action}
          request={null}
        />
      </OnboardingLayout>
    );
  }
}

const mapDispatchToProps = {
  installAppFirstTime,
};

export default compose(connect(null, mapDispatchToProps))(
  withOnboardingContext(OnboardingStepPairNew),
);

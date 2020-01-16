// @flow

import React, { Component } from "react";
import { Trans } from "react-i18next";
import { TrackScreen } from "../../../analytics";
import Button from "../../../components/Button";
import OnboardingLayout from "../OnboardingLayout";
import { withOnboardingContext } from "../onboardingContext";
import AnalyticsRow from "../../Settings/General/AnalyticsRow";
import ReportErrorsRow from "../../Settings/General/ReportErrorsRow";
import TechnicalDataRow from "../../Settings/General/TechnicalDataRow";

import type { OnboardingStepProps } from "../types";

class OnboardingStepShareData extends Component<OnboardingStepProps> {
  Footer = () => {
    const { next } = this.props;
    return (
      <Button
        event="OnboardingShareDataContinue"
        type="primary"
        title={<Trans i18nKey="common.continue" />}
        onPress={next}
      />
    );
  };

  render() {
    return (
      <OnboardingLayout
        header="OnboardingStepShareData"
        Footer={this.Footer}
        noHorizontalPadding
        noTopPadding
        withNeedHelp
      >
        <TrackScreen category="Onboarding" name="ShareData" />
        <AnalyticsRow />
        <ReportErrorsRow borderTop />
        <TechnicalDataRow borderTop />
      </OnboardingLayout>
    );
  }
}

export default withOnboardingContext(OnboardingStepShareData);

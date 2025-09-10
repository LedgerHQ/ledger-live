import React from "react";
import { Trans } from "react-i18next";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import { StepProps } from "../Body";
import { useHistory } from "react-router";

export default function StepOptions(props: Readonly<StepProps>) {
  const { eventType, transitionTo, closeModal } = props;
  const history = useHistory();

  function handleGoToReceiveProvider() {
    closeModal();
    history.push({
      pathname: "/receive",
    });
  }

  // TODO: actual buttons
  return (
    <Box flow={1}>
      <TrackPage category={`Receive Flow${eventType ? ` (${eventType})` : ""}`} name="Step 1" />
      <Button primary onClick={() => transitionTo("account")}>
        <Trans i18nKey="common.continue" />
      </Button>
      <Button primary onClick={handleGoToReceiveProvider}>
        <Trans i18nKey="common.continue" />
      </Button>
    </Box>
  );
}

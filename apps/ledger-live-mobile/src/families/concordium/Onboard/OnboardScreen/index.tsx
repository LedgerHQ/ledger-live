import React, { useCallback, useEffect, useState } from "react";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { useSelector } from "~/context/hooks";
import { isTokenCurrency } from "@ledgerhq/live-common/currencies/index";
import {
  setWalletConnect,
  clearWalletConnect,
} from "@ledgerhq/coin-concordium/network/walletConnect";
import { ScreenName } from "~/const";
import { lastConnectedDeviceSelector } from "~/reducers/settings";
import type { ConcordiumOnboardAccountParamList } from "../types";
import StepOnboard from "./components/StepOnboard";
import StepPair from "./components/StepPair";
import StepCreate from "./components/StepCreate";
import StepFinish from "./components/StepFinish";

enum Step {
  ONBOARD = "ONBOARD",
  PAIR = "PAIR",
  CREATE = "CREATE",
  FINISH = "FINISH",
}

type OnboardRouteProps = RouteProp<
  ConcordiumOnboardAccountParamList,
  typeof ScreenName.ConcordiumOnboardAccount
>;

export default function OnboardScreen() {
  const route = useRoute<OnboardRouteProps>();
  const { accountsToAdd, currency } = route.params;
  const cryptoCurrency = isTokenCurrency(currency) ? currency.parentCurrency : currency;
  const device = useSelector(lastConnectedDeviceSelector);

  const [step, setStep] = useState<Step>(Step.ONBOARD);
  const [sessionTopic, setSessionTopic] = useState<string | null>(null);

  useEffect(() => {
    const wc = setWalletConnect();
    return () => {
      wc.disconnectAllSessions();
      clearWalletConnect();
    };
  }, []);

  const handleAgree = useCallback(() => {
    setStep(Step.PAIR);
  }, []);

  const handlePaired = useCallback((topic: string) => {
    setSessionTopic(topic);
    setStep(Step.CREATE);
  }, []);

  const handleCreated = useCallback(() => {
    setStep(Step.FINISH);
  }, []);

  const handleDone = useCallback(() => {
    // TODO: dispatch addAccountsAction and navigate to AddAccountsSuccess
  }, []);

  const handleSessionExpired = useCallback(() => {
    setSessionTopic(null);
    setStep(Step.PAIR);
  }, []);

  switch (step) {
    case Step.ONBOARD:
      return <StepOnboard onAgree={handleAgree} />;
    case Step.PAIR:
      return <StepPair currency={cryptoCurrency} onPaired={handlePaired} />;
    case Step.CREATE: {
      if (!sessionTopic || !device || !accountsToAdd[0]) return null;
      return (
        <StepCreate
          currency={cryptoCurrency}
          deviceId={device.deviceId}
          creatableAccount={accountsToAdd[0]}
          sessionTopic={sessionTopic}
          onCreated={handleCreated}
          onSessionExpired={handleSessionExpired}
        />
      );
    }
    case Step.FINISH:
      return <StepFinish onDone={handleDone} />;
  }
}

import React, { useCallback, useEffect, useState } from "react";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { isTokenCurrency } from "@ledgerhq/live-common/currencies/index";
import {
  setWalletConnect,
  clearWalletConnect,
} from "@ledgerhq/coin-concordium/network/walletConnect";
import { ScreenName } from "~/const";
import type { ConcordiumOnboardAccountParamList } from "../types";
import StepOnboard from "./components/StepOnboard";
import StepPair from "./components/StepPair";
import StepCreate from "./components/StepCreate";

enum Step {
  ONBOARD = "ONBOARD",
  PAIR = "PAIR",
  CREATE = "CREATE",
}

type OnboardRouteProps = RouteProp<
  ConcordiumOnboardAccountParamList,
  typeof ScreenName.ConcordiumOnboardAccount
>;

export default function OnboardScreen() {
  const route = useRoute<OnboardRouteProps>();
  const { currency } = route.params;
  const cryptoCurrency = isTokenCurrency(currency) ? currency.parentCurrency : currency;

  const [step, setStep] = useState<Step>(Step.ONBOARD);

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

  const handlePaired = useCallback(() => {
    setStep(Step.CREATE);
  }, []);

  switch (step) {
    case Step.ONBOARD:
      return <StepOnboard onAgree={handleAgree} />;
    case Step.PAIR:
      return <StepPair currency={cryptoCurrency} onPaired={handlePaired} />;
    case Step.CREATE:
      return <StepCreate />;
  }
}

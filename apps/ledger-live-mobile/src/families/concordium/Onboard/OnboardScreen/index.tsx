import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { useSelector } from "~/context/hooks";
import { isTokenCurrency } from "@ledgerhq/live-common/currencies/index";
import { getDefaultAccountName } from "@ledgerhq/live-wallet/accountName";
import {
  setWalletConnect,
  clearWalletConnect,
} from "@ledgerhq/coin-concordium/network/walletConnect";
import { log } from "@ledgerhq/logs";
import { Flex, SlideIndicator } from "@ledgerhq/native-ui";
import { ScreenName } from "~/const";
import { lastConnectedDeviceSelector } from "~/reducers/settings";
import type { ConcordiumOnboardAccountParamList } from "../types";
import StepOnboard from "./components/StepOnboard";
import StepPair from "./components/StepPair";
import StepPairSuccess from "./components/StepPairSuccess";
import StepCreate from "./components/StepCreate";
import StepFinish from "./components/StepFinish";

enum Step {
  ONBOARD = "ONBOARD",
  PAIR = "PAIR",
  PAIR_SUCCESS = "PAIR_SUCCESS",
  CREATE = "CREATE",
  FINISH = "FINISH",
}

const STEPPER = {
  length: 3,
  index: {
    [Step.ONBOARD]: 0,
    [Step.PAIR]: 0,
    [Step.PAIR_SUCCESS]: 0,
    [Step.CREATE]: 1,
    [Step.FINISH]: 2,
  },
} as const;

type OnboardRouteProps = RouteProp<
  ConcordiumOnboardAccountParamList,
  typeof ScreenName.ConcordiumOnboardAccount
>;

export default function OnboardScreen() {
  const navigation = useNavigation();
  const route = useRoute<OnboardRouteProps>();
  const { accountsToAdd, currency } = route.params;
  const cryptoCurrency = isTokenCurrency(currency) ? currency.parentCurrency : currency;
  const device = useSelector(lastConnectedDeviceSelector);

  const [step, setStep] = useState<Step>(Step.ONBOARD);
  const [sessionTopic, setSessionTopic] = useState<string | null>(null);

  const creatableAccount = useMemo(
    () => accountsToAdd.find(account => !account.used),
    [accountsToAdd],
  );

  const accountName = creatableAccount ? getDefaultAccountName(creatableAccount) : undefined;

  useEffect(() => {
    const wc = setWalletConnect();
    return () => {
      wc.disconnectAllSessions();
      clearWalletConnect();
    };
  }, []);

  const handleCancel = useCallback(() => {
    const parent = navigation.getParent();
    if (parent) {
      parent.goBack();
    } else {
      navigation.goBack();
    }
  }, [navigation]);

  const handleAgree = useCallback(() => {
    setStep(Step.PAIR);
  }, []);

  const handlePaired = useCallback((topic: string) => {
    setSessionTopic(topic);
    setStep(Step.PAIR_SUCCESS);
  }, []);

  const handleContinueToCreate = useCallback(() => {
    if (!sessionTopic || !device || !creatableAccount) {
      log("concordium-onboarding", "CREATE step missing prerequisites, falling back to PAIR", {
        hasSessionTopic: !!sessionTopic,
        hasDevice: !!device,
        hasCreatableAccount: !!creatableAccount,
      });
      setSessionTopic(null);
      setStep(Step.PAIR);
      return;
    }
    setStep(Step.CREATE);
  }, [sessionTopic, device, creatableAccount]);

  const handleCreated = useCallback(() => {
    setStep(Step.FINISH);
  }, []);

  const handleDone = useCallback(() => {
    // LIVE-26412: dispatch addAccountsAction and navigate to AddAccountsSuccess
  }, []);

  const handleSessionExpired = useCallback(() => {
    setSessionTopic(null);
    setStep(Step.PAIR);
  }, []);

  useEffect(() => {
    if (step === Step.CREATE && (!sessionTopic || !device || !creatableAccount)) {
      handleSessionExpired();
    }
  }, [step, sessionTopic, device, creatableAccount, handleSessionExpired]);

  const renderStep = () => {
    switch (step) {
      case Step.ONBOARD:
        return <StepOnboard onAgree={handleAgree} onCancel={handleCancel} />;
      case Step.PAIR:
        return <StepPair currency={cryptoCurrency} onPaired={handlePaired} />;
      case Step.PAIR_SUCCESS:
        return <StepPairSuccess onContinue={handleContinueToCreate} />;
      case Step.CREATE: {
        if (!sessionTopic || !device || !creatableAccount) {
          return null;
        }
        return (
          <StepCreate
            currency={cryptoCurrency}
            deviceId={device.deviceId}
            creatableAccount={creatableAccount}
            accountName={accountName}
            sessionTopic={sessionTopic}
            onCreated={handleCreated}
            onSessionExpired={handleSessionExpired}
          />
        );
      }
      case Step.FINISH:
        return <StepFinish onDone={handleDone} />;
    }
  };

  return (
    <Flex flex={1}>
      <Flex alignItems="center" pt={4} pb={2}>
        <SlideIndicator slidesLength={STEPPER.length} activeIndex={STEPPER.index[step]} />
      </Flex>
      {renderStep()}
    </Flex>
  );
}

/* eslint-disable @typescript-eslint/ban-ts-comment */

import React, { useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import Modal, { ModalBody } from "~/renderer/components/Modal";
import Select from "~/renderer/components/Select";
import { ScrollArea } from "~/renderer/components/Onboarding/ScrollArea";
import { Flex, Text } from "@ledgerhq/react-ui";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import Switch from "~/renderer/components/Switch";
import ButtonV3 from "~/renderer/components/ButtonV3";
import { FlowOptions } from "~/newArch/WalletSync/Flows/useFlows";
import { useDispatch } from "react-redux";
import { setFaked, setFlow, setWalletSync } from "~/renderer/actions/walletSync";
import { useHistory } from "react-router";
import { useTheme } from "styled-components";

const WalletSyncDebugger = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const history = useHistory();
  const dispatch = useDispatch();

  const [state, setState] = useState<{
    flow: Flow;
    step: Step | null;
    activated: boolean;
  }>({
    flow: Flow.Activation,
    step: Step.CreateOrSynchronizeStep,
    activated: false,
  });

  const flowsOptions = Object.keys(FlowOptions).map(flow => ({
    label: flow,
    value: flow as Flow,
  }));

  const stepOptions = useMemo(() => {
    const currentFlow = FlowOptions[state.flow];
    return Object.values(currentFlow.steps).map(step => ({
      label: step,
      value: step,
    }));
  }, [state.flow]);

  const apply = () => {
    if (state.flow && state.step) {
      dispatch(setFlow({ flow: state.flow, step: state.step }));
      dispatch(setWalletSync(state.activated));
      dispatch(setFaked(true));
      history.push("/settings");
      setTimeout(() => {
        const aboutPageNode = document.getElementById("setting-walletSync");
        aboutPageNode?.scrollIntoView({ behavior: "smooth" });
      }, 0);
    }
  };

  return (
    <Modal
      name="MODAL_WALLET_SYNC_DEBUGGER"
      centered
      render={({ onClose }) => (
        <ModalBody
          onClose={onClose}
          onBack={undefined}
          title={<Trans i18nKey="settings.experimental.features.testWalletSync.title" />}
          noScroll
          render={() => (
            <ScrollArea>
              <Flex flexDirection="column" justifyContent="center" rowGap={"24px"}>
                <Flex justifyContent="space-between" alignItems="center">
                  <Text>{t("settings.experimental.features.testWalletSync.modal.flow")}</Text>

                  <Select
                    minWidth={275}
                    isSearchable={false}
                    onChange={option => {
                      if (option) {
                        setState({ ...state, flow: option.value as Flow, step: null });
                      }
                    }}
                    value={{ label: String(state.flow), value: String(state.flow) }}
                    options={flowsOptions}
                  />
                </Flex>

                <Flex justifyContent="space-between" alignItems="center">
                  <Text>{t("settings.experimental.features.testWalletSync.modal.step")}</Text>
                  <Select
                    minWidth={275}
                    isSearchable={false}
                    onChange={option => {
                      if (option) {
                        setState({ ...state, step: option.value as Step });
                      }
                    }}
                    value={{ label: String(state.step), value: String(state.step) }}
                    options={stepOptions}
                  />
                </Flex>

                <Flex justifyContent="space-between" alignItems="center">
                  <Text>{t("settings.experimental.features.testWalletSync.modal.activated")}</Text>
                  <Switch
                    isChecked={state.activated}
                    onChange={() => setState({ ...state, activated: !state.activated })}
                  />
                </Flex>

                <Flex
                  justifyContent="center"
                  backgroundColor={colors.opacityDefault.c05}
                  p={3}
                  borderRadius={8}
                >
                  <Text fontSize={11}>{JSON.stringify(state, null, 2)}</Text>
                </Flex>

                <ButtonV3
                  variant="main"
                  onClick={() => {
                    apply();
                    onClose();
                  }}
                  disabled={!state.step}
                >
                  {t("settings.experimental.features.testWalletSync.modal.cta")}
                </ButtonV3>
              </Flex>
            </ScrollArea>
          )}
        />
      )}
    />
  );
};
export default WalletSyncDebugger;

import React, { useMemo, useState } from "react";
import Select from "~/renderer/components/Select";
import { Flex, Text } from "@ledgerhq/react-ui";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { Switch, Button } from "@ledgerhq/lumen-ui-react";
import { useDispatch } from "LLD/hooks/redux";
import {
  addInstance,
  setFaked,
  setFlow,
  setQrCodePinCode,
  setQrCodeUrl,
} from "~/renderer/actions/walletSync";
import { useNavigate } from "react-router";
import styled, { useTheme } from "styled-components";
import { TrustchainMember } from "@ledgerhq/ledger-key-ring-protocol/types";
import { FlowOptions } from "LLD/features/WalletSync/hooks/useFlows";
import { useTranslation } from "react-i18next";

type State = {
  flow: Flow;
  step: Step | null;
  instances: TrustchainMember[];
};

export function GeneratorLedgerSync() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigate = useNavigate();

  const [state, setState] = useState<State>({
    flow: Flow.Activation,
    step: Step.CreateOrSynchronize,
    instances: [],
  });

  const flowsOptions = Object.keys(FlowOptions).map(flow => ({
    label: flow,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
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
      dispatch(setFaked(true));

      dispatch(setQrCodePinCode("392"));
      dispatch(setQrCodeUrl("url"));

      if (state.instances.length > 0)
        state.instances.forEach(instance => dispatch(addInstance(instance)));

      navigate("/settings");
      setTimeout(() => {
        const aboutPageNode = document.getElementById("setting-walletSync");
        aboutPageNode?.scrollIntoView({ behavior: "smooth" });
      }, 0);
    }
  };

  const generateInstances = () => {
    if (state.instances.length > 0) {
      setState({ ...state, instances: [] });
      return;
    }
    const instances = Array.from(
      { length: Math.floor(Math.random() * 5) },
      (_, index): TrustchainMember => ({
        id: String(index),
        name: index % 2 === 0 ? `Iphone ${index + 1}` : "macOS",
        permissions: index % 2 === 0 ? 1 : 2,
      }),
    );

    setState({ ...state, instances });
  };
  return (
    <Flex flexDirection="column" rowGap={"24px"} position="relative">
      <Flex justifyContent="space-between" alignItems="center">
        <Text>{t("settings.developer.debugWalletSync.modal.generator.flow")}</Text>

        <Select
          minWidth={275}
          isSearchable={false}
          onChange={option => {
            if (option) {
              // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
              setState({ ...state, flow: option.value as Flow, step: null });
            }
          }}
          value={{ label: String(state.flow), value: String(state.flow) }}
          options={flowsOptions}
        />
      </Flex>

      <Flex justifyContent="space-between" alignItems="center">
        <Text>{t("settings.developer.debugWalletSync.modal.generator.step")}</Text>
        <Select
          minWidth={275}
          isSearchable={false}
          onChange={option => {
            if (option) {
              // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
              setState({ ...state, step: option.value as Step });
            }
          }}
          value={{ label: String(state.step), value: String(state.step) }}
          options={stepOptions}
        />
      </Flex>

      <Flex justifyContent="space-between" alignItems="center">
        <Text>{t("settings.developer.debugWalletSync.modal.generator.instance")}</Text>
        <Switch selected={state.instances.length > 0} onChange={generateInstances} />
      </Flex>

      <StingifyComponent
        flexDirection="column"
        backgroundColor={colors.opacityDefault.c05}
        p={3}
        borderRadius={8}
      >
        {Object.entries(state).map(([key, value]) => (
          <Text fontSize={11} key={key}>
            <pre>
              {`"${key}"`} : {JSON.stringify(value, null, 2)}
            </pre>
          </Text>
        ))}
      </StingifyComponent>

      <Button
        appearance="base"
        size="sm"
        onClick={() => {
          apply();
          // onClose();
        }}
        disabled={!state.step}
      >
        {t("settings.developer.debugWalletSync.modal.generator.cta")}
      </Button>
    </Flex>
  );
}

const StingifyComponent = styled(Flex)`
  max-height: 300px;
  overflow-y: auto;

  &::-webkit-scrollbar-thumb {
    background-color: ${p => p.theme.colors.opacityDefault.c20};
  }

  &::-webkit-scrollbar-track {
    background-color: ${p => p.theme.colors.opacityDefault.c10};
    border-radius: 8px;
  }
`;

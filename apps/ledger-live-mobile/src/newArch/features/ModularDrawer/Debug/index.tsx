import React from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import Button from "~/components/Button";
import { ModularDrawer } from "../ModularDrawer";
import { ModularDrawerStep } from "../types";
import { listAndFilterCurrencies } from "@ledgerhq/live-common/platform/helpers";
import { useModularDrawer } from "../hooks/useModularDrawer";

const steps = [ModularDrawerStep.Asset, ModularDrawerStep.Network, ModularDrawerStep.Account];

function ModularDrawerScreenDebug() {
  const { isDrawerOpen, openDrawer, closeDrawer, resetState, setStep, currentStep } =
    useModularDrawer();

  const handleToggleDrawer = () => {
    if (isDrawerOpen) {
      closeDrawer();
    } else {
      openDrawer();
    }
  };
  const handleDrawerClose = () => {
    closeDrawer();
    resetState();
  };

  const handleStepSelect = (step: ModularDrawerStep) => {
    setStep(step);
  };

  const currencies = listAndFilterCurrencies({ includeTokens: true });

  return (
    <Flex flexDirection="column" rowGap={4} px={6}>
      <Button size="small" type="main" title="Open MAD Drawer" onPress={handleToggleDrawer} />
      <Flex mt={3} flexDirection="row" columnGap={8} alignItems="center" justifyContent="center">
        {steps.map(step => (
          <Button
            key={step}
            size="small"
            type={currentStep === step ? "color" : "main"}
            title={step}
            onPress={() => handleStepSelect(step)}
          />
        ))}
      </Flex>
      <Flex alignItems="center" mt={2}>
        <Text style={{ fontSize: 14, marginTop: 8 }}>{`Selected step: ${currentStep}`}</Text>
      </Flex>
      <ModularDrawer isOpen={isDrawerOpen} onClose={handleDrawerClose} currencies={currencies} />
    </Flex>
  );
}

export default ModularDrawerScreenDebug;

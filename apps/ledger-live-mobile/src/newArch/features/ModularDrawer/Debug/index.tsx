import React, { useState } from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import Button from "~/components/Button";
import { ModularDrawer } from "../ModularDrawer";
import { ModularDrawerStep } from "../types";
import { listAndFilterCurrencies } from "@ledgerhq/live-common/platform/helpers";

const steps = [ModularDrawerStep.Asset, ModularDrawerStep.Network, ModularDrawerStep.Account];

function ModularDrawerScreenDebug() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedStep, setSelectedStep] = useState<ModularDrawerStep>(ModularDrawerStep.Asset);

  const handleToggleDrawer = () => setIsDrawerOpen(open => !open);
  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setSelectedStep(ModularDrawerStep.Asset);
  };
  const handleStepSelect = (step: ModularDrawerStep) => setSelectedStep(step);

  const currencies = listAndFilterCurrencies({ includeTokens: false, currencies: [] });

  return (
    <Flex flexDirection="column" rowGap={4} px={6}>
      <Button size="small" type="main" title="Open MAD Drawer" onPress={handleToggleDrawer} />
      <Flex mt={3} flexDirection="row" columnGap={8} alignItems="center" justifyContent="center">
        {steps.map(step => (
          <Button
            key={step}
            size="small"
            type={selectedStep === step ? "color" : "main"}
            title={step}
            onPress={() => handleStepSelect(step)}
          />
        ))}
      </Flex>
      <Flex alignItems="center" mt={2}>
        <Text style={{ fontSize: 14, marginTop: 8 }}>{`Selected step: ${selectedStep}`}</Text>
      </Flex>
      <ModularDrawer
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
        selectedStep={selectedStep}
        currencies={currencies}
      />
    </Flex>
  );
}

export default ModularDrawerScreenDebug;

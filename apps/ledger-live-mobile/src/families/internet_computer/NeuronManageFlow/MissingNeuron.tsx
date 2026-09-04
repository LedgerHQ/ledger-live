import { Button, Flex, Text } from "@ledgerhq/native-ui";
import React from "react";
import SafeAreaView from "~/components/SafeAreaView";
import { useTranslation } from "~/context/Locale";

type Props = Readonly<{ onBackToList: () => void }>;

/**
 * Shown by any screen that addresses one neuron, once that neuron leaves the snapshot. A disburse or
 * a refresh both drop one, and these screens resolve the neuron live out of redux by the id in their
 * route params — so a mounted screen can lose its neuron with the user standing still, and the
 * navigator keeps it in the stack to come back to. Rendering nothing left a blank screen with no way
 * to read what had happened.
 */
export default function MissingNeuron({ onBackToList }: Props) {
  const { t } = useTranslation();

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} isFlex>
      <Flex flex={1} p={6} justifyContent="center" style={{ gap: 16 }}>
        <Text variant="body" color="neutral.c70" textAlign="center">
          {t("internetComputer.manageNeuronFlow.manage.missingNeuron")}
        </Text>
        <Button type="main" onPress={onBackToList} testID="icp-missing-neuron-back-button">
          {t("internetComputer.manageNeuronFlow.confirmation.backToNeurons")}
        </Button>
      </Flex>
    </SafeAreaView>
  );
}

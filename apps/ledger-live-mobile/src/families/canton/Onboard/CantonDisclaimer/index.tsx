import React from "react";
import { Pressable } from "react-native";
import { Button, Checkbox, Flex, Text } from "@ledgerhq/native-ui";
import { Trans, useTranslation } from "~/context/Locale";
import CantonTermsDrawer from "./CantonTermsDrawer";
import { useCantonDisclaimerViewModel } from "./useCantonDisclaimerViewModel";

type Props = Readonly<{
  onAgree: () => void;
  onCancel: () => void;
}>;

const BULLET_KEYS = ["utxo", "offers", "dualValidator", "tokenLiability"] as const;

export default function CantonDisclaimer({ onAgree, onCancel }: Props) {
  const { t } = useTranslation();
  const { agreed, isTermsOpen, handleToggleAgreed, handleOpenTerms, handleCloseTerms } =
    useCantonDisclaimerViewModel();

  return (
    <Flex flexDirection="column" px={6} pb={6} testID="canton-disclaimer">
      <Text variant="h4" fontWeight="semiBold" color="neutral.c100" mb={3}>
        {t("canton.disclaimer.title")}
      </Text>
      <Text variant="body" color="neutral.c80" mb={4}>
        {t("canton.disclaimer.intro")}
      </Text>

      {BULLET_KEYS.map(key => (
        <Flex key={key} flexDirection="row" alignItems="flex-start" mb={3}>
          <Text variant="body" color="neutral.c100" mr={2} mt={1}>
            •
          </Text>
          <Flex flex={1}>
            <Text variant="body" fontWeight="semiBold" color="neutral.c100">
              {t(`canton.disclaimer.bullets.${key}.title`)}
            </Text>
            <Text variant="body" color="neutral.c80">
              {t(`canton.disclaimer.bullets.${key}.body`)}
            </Text>
          </Flex>
        </Flex>
      ))}

      <Pressable
        onPress={handleToggleAgreed}
        testID="canton-disclaimer-agree-row"
        accessibilityRole="checkbox"
        accessibilityState={{ checked: agreed }}
      >
        <Flex flexDirection="row" alignItems="center" mt={4}>
          <Checkbox checked={agreed} onChange={handleToggleAgreed} />
          <Flex flex={1} ml={3}>
            <Text variant="body" color="neutral.c80">
              <Trans
                i18nKey="canton.disclaimer.agreeLabel"
                components={{
                  1: (
                    <Text
                      variant="body"
                      color="primary.c80"
                      onPress={handleOpenTerms}
                      testID="canton-disclaimer-terms-link"
                    />
                  ),
                }}
              />
            </Text>
          </Flex>
        </Flex>
      </Pressable>

      <Flex flexDirection="row" justifyContent="space-between" mt={6}>
        <Flex flex={1} mr={2}>
          <Button type="default" onPress={onCancel} testID="canton-disclaimer-cancel">
            {t("canton.disclaimer.cancel")}
          </Button>
        </Flex>
        <Flex flex={1} ml={2}>
          <Button type="main" onPress={onAgree} disabled={!agreed} testID="canton-disclaimer-agree">
            {t("canton.disclaimer.agree")}
          </Button>
        </Flex>
      </Flex>

      <CantonTermsDrawer isOpen={isTermsOpen} onClose={handleCloseTerms} />
    </Flex>
  );
}

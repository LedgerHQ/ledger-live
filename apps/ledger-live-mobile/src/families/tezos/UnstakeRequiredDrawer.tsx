import React, { useCallback } from "react";
import { Linking } from "react-native";
import { Flex, Text, Button, Link } from "@ledgerhq/native-ui";
import { ExternalLinkMedium } from "@ledgerhq/native-ui/assets/icons";
import { Trans, useTranslation } from "~/context/Locale";
import { TrackScreen } from "~/analytics";
import QueuedDrawer from "~/components/QueuedDrawer";
import BulletList, { Bullet } from "~/components/BulletList";
import { urls } from "~/utils/urls";

export type UnstakeRequiredReason = "changeBaker" | "endDelegation";

type Props = Readonly<{
  isOpen: boolean;
  reason: UnstakeRequiredReason;
  onClose: () => void;
}>;

const STEP_KEYS = [0, 1, 2, 3] as const;

export default function UnstakeRequiredDrawer({ isOpen, reason, onClose }: Props) {
  const { t } = useTranslation();
  const onLearnMore = useCallback(() => Linking.openURL(urls.delegation), []);

  return (
    <QueuedDrawer isRequestingToBeOpened={isOpen} onClose={onClose}>
      <TrackScreen
        category="Delegation Flow"
        name="Unstake Required"
        type="modal"
        flow="stake"
        action="delegation"
        currency="xtz"
      />
      <Flex px={4} pb={4}>
        <Text variant="h3" fontWeight="semiBold" mb={4}>
          <Trans i18nKey={`tezos.unstakeRequired.${reason}.title`} />
        </Text>
        <Text variant="body" color="neutral.c70" mb={6}>
          <Trans i18nKey={`tezos.unstakeRequired.${reason}.description`} />
        </Text>
        <BulletList
          Bullet={Bullet}
          list={STEP_KEYS.map(i => (
            <Trans key={i} i18nKey={`tezos.unstakeRequired.steps.${i}`} />
          ))}
        />
        <Flex alignItems="flex-start" mt={4} mb={6}>
          <Link
            type="main"
            size="medium"
            Icon={ExternalLinkMedium}
            iconPosition="right"
            onPress={onLearnMore}
          >
            {t("tezos.unstakeRequired.learnMore")}
          </Link>
        </Flex>
        <Button type="main" size="large" onPress={onClose} testID="tezos-unstake-required-close">
          {t("tezos.unstakeRequired.close")}
        </Button>
      </Flex>
    </QueuedDrawer>
  );
}

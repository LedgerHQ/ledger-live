import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Linking } from "react-native";

import { Box, Flex, Text } from "@ledgerhq/native-ui";

import ExternalLink from "../ExternalLink";
import QueuedDrawer from "../QueuedDrawer";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  family: string;
  team: string;
  teamLink?: string;
};

type TeamLinkProps = {
  team: string;
  teamLink: string;
};

const TeamLink = ({ team, teamLink }: TeamLinkProps) => {
  const { t } = useTranslation();

  const onOpenTeam = useCallback(() => {
    Linking.openURL(teamLink);
  }, [teamLink]);

  return (
    <>
      <Flex flexDirection="row" alignItems="center">
        <Text>{t("account.subHeader.drawer.descriptionLink.integration")} </Text>
        <ExternalLink type="color" text={team} onPress={onOpenTeam} />
      </Flex>
      <Text>{t("account.subHeader.drawer.descriptionLink.collab")}</Text>
    </>
  );
};

export default function AccountSubHeaderDrawer({ isOpen, onClose, family, team, teamLink }: Props) {
  const { t } = useTranslation();
  return (
    <QueuedDrawer
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
      title={t("account.subHeader.drawer.title", { family })}
      description={t("account.subHeader.drawer.subTitle", { family, team })}
    >
      <Box alignItems="center">
        <Text variant={"paragraph"} color={"neutral.c100"} textAlign="center">
          {t("account.subHeader.drawer.description")}
        </Text>
        <Text variant={"paragraph"} color={"neutral.c100"} mt={2} textAlign="center">
          {t("account.subHeader.drawer.description2")}
        </Text>
        {teamLink ? (
          <TeamLink team={team} teamLink={teamLink} />
        ) : (
          <Text variant={"paragraph"} color={"neutral.c100"} mt={2} textAlign="center">
            {t("account.subHeader.drawer.description3", { team })}
          </Text>
        )}
      </Box>
    </QueuedDrawer>
  );
}

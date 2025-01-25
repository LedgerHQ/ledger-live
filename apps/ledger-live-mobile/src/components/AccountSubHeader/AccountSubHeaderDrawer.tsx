import React, { useCallback } from "react";
import { Trans, useTranslation } from "react-i18next";
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
  const onOpenTeam = useCallback(() => {
    Linking.openURL(teamLink);
  }, [teamLink]);

  return (
    <Text textAlign={"center"}>
      <Trans i18nKey="account.subHeader.drawer.description3Link">
        {"This integration has been carried out by"}
        <Flex style={{ transform: "translateY(5px)" }}>
          <ExternalLink type="color" text={team} onPress={onOpenTeam} />
        </Flex>
        {"in collaboration with Ledger"}
      </Trans>
    </Text>
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

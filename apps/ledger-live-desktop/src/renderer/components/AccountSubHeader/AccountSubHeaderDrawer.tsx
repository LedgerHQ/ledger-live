import React, { useCallback } from "react";
import { Trans, useTranslation } from "react-i18next";
import styled from "styled-components";

import { Link } from "@ledgerhq/react-ui";

import Box from "~/renderer/components/Box";
import { SideDrawer } from "~/renderer/components/SideDrawer";
import Text from "~/renderer/components/Text";
import IconExternalLink from "~/renderer/icons/ExternalLink";
import { openURL } from "~/renderer/linking";

const ExternalLinkIconContainer = styled.span`
  display: inline-flex;
  margin-left: 4px;
`;
type Props = {
  isOpen: boolean;
  closeDrawer: () => void;
  family: string;
  team: string;
  teamLink?: string;
};
const Title = styled(Text)`
  font-style: normal;
  font-weight: 600;
  font-size: 22px;
  line-height: 27px;
`;
const Description = styled(Text)`
  font-size: 13px;
`;

type TeamLinkProps = {
  team: string;
  teamLink: string;
};

const TeamLink = ({ team, teamLink }: TeamLinkProps) => {
  const onOpenTeam = useCallback(() => {
    openURL(teamLink);
  }, [teamLink]);

  return (
    <Trans i18nKey="account.subHeader.drawer.description3Link">
      This integration has been carried out by
      <Link
        verticalAlign={"bottom"}
        onClick={onOpenTeam}
        justifyContent="center"
        color={"palette.primary.main"}
      >
        {team}
        <ExternalLinkIconContainer>
          <IconExternalLink size={12} />
        </ExternalLinkIconContainer>
      </Link>
      in collaboration with Ledger
    </Trans>
  );
};

export function AccountSubHeaderDrawer({ isOpen, closeDrawer, family, team, teamLink }: Props) {
  const { t } = useTranslation();
  return (
    <SideDrawer
      title={t("account.subHeader.drawer.title", {
        family,
      })}
      isOpen={isOpen}
      onRequestClose={closeDrawer}
      direction="left"
    >
      <Box px={40} py={40}>
        <Title>
          {t("account.subHeader.drawer.subTitle", {
            family,
            team,
          })}
        </Title>
        <Box py={3}>
          <Description>{t("account.subHeader.drawer.description")}</Description>
        </Box>
        <Box py={2}>
          <Description>{t("account.subHeader.drawer.description2")}</Description>
        </Box>
        <Box py={2}>
          <Description>
            {teamLink ? (
              <TeamLink team={team} teamLink={teamLink} />
            ) : (
              t("account.subHeader.drawer.description3", {
                team,
              })
            )}
          </Description>
        </Box>
      </Box>
    </SideDrawer>
  );
}
export default AccountSubHeaderDrawer;

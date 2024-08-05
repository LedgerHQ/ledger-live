import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Theme } from "@ledgerhq/react-ui/styles/theme";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import Box from "~/renderer/components/Box";
import LiveAppIcon from "~/renderer/components/WebPlatformPlayer/LiveAppIcon";

function getBranchColor(branch: LiveAppManifest["branch"], colors: Theme["colors"]) {
  switch (branch) {
    case "soon":
      return colors.neutral.c00;
    case "experimental":
      return colors.warning;
    case "debug":
      return colors.opacityDefault.c40;
    default:
      return "currentColor";
  }
}

const HeaderContainer = styled(Box)`
  width: 100%;
  flex-direction: row;
  align-items: center;
`;

export const IconContainer = styled(Box).attrs({
  mr: 2,
})`
  user-select: none;
  pointer-events: none;
`;

const TitleContainer = styled.div`
  flex-shrink: 1;
`;

const AppName = styled(Box).attrs(p => ({
  ff: "Inter|SemiBold",
  fontSize: 5,
  textAlign: "left",
  color: p.theme.colors.palette.secondary.main,
}))`
  line-height: 18px;
`;

const Content = styled(Box)`
  margin-top: 16px;
  width: 100%;

  :empty {
    display: none;
  }
`;

const BranchBadge = styled(Box).attrs<{ branch: LiveAppManifest["branch"] }>(p => ({
  ff: "Inter|SemiBold",
  fontSize: 1,
  color: getBranchColor(p.branch, p.theme.colors),
}))<{ branch: string }>`
  display: inline-block;
  padding: 1px 4px;
  border: 1px solid currentColor;
  border-radius: 3px;
  text-transform: uppercase;
  margin-bottom: 4px;
  flex-grow: 0;
  flex-shrink: 1;

  ${p =>
    p.branch === "soon" &&
    `
    background: ${p.theme.colors.palette.text.shade20};
    border-width: 0;
  `}
`;

type Props = {
  manifest: LiveAppManifest;
};

export function AppDetails({ manifest }: Props) {
  const { t } = useTranslation();
  const description = manifest.content.description.en;

  return (
    <>
      <HeaderContainer>
        <IconContainer data-testid="live-icon-container">
          <LiveAppIcon icon={manifest.icon || undefined} name={manifest.name} size={48} />
        </IconContainer>
        <TitleContainer>
          {manifest.branch !== "stable" && (
            <BranchBadge branch={manifest.branch}>
              {t(`platform.catalog.branch.${manifest.branch}`)}
            </BranchBadge>
          )}
          <AppName>{manifest.name}</AppName>
        </TitleContainer>
      </HeaderContainer>
      <Content>{description}</Content>
    </>
  );
}

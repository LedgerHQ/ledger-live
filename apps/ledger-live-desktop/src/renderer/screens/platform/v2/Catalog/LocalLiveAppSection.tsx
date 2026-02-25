import React from "react";
import { Flex } from "@ledgerhq/react-ui";
import { MinimumCard } from "./Card";
import styled from "styled-components";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { useNavigate } from "react-router";
import { SectionHeader } from "./SectionHeader";
import { useTranslation } from "react-i18next";

export function LocalLiveAppSection({ localLiveApps }: { localLiveApps: LiveAppManifest[] }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Flex flexDirection="column" marginBottom={4}>
      <SectionHeader iconLeft="Download">
        {t("platform.catalog.section.locallyLoaded")}
      </SectionHeader>
      <Scroll>
        {localLiveApps.map(manifest => (
          <Flex key={manifest.id} margin={2}>
            <MinimumCard
              manifest={manifest}
              onClick={(manifest: LiveAppManifest) => navigate(`/platform/${manifest.id}`)}
            />
          </Flex>
        ))}
      </Scroll>
    </Flex>
  );
}

const Scroll = styled(Flex).attrs({ overflowX: "scroll" })`
  &::-webkit-scrollbar {
    display: none;
  }
`;

import React from "react";
import { useTranslation } from "react-i18next";
import { Flex, Text } from "@ledgerhq/react-ui";
import { RecentlyUsed as RecentlyUsedType } from "@ledgerhq/live-common/wallet-api/react";
import { SectionHeader } from "./SectionHeader";
import { MinimumCard } from "./Card";
import styled from "styled-components";
import { Disclaimer } from "../hooks";

export function RecentlyUsed({
  recentlyUsed,
  disclaimer,
}: {
  recentlyUsed: Pick<RecentlyUsedType, "data" | "clear">;
  disclaimer: Pick<Disclaimer, "onSelect">;
}) {
  const { t } = useTranslation();

  return (
    <Flex flexDirection="column" marginBottom={4}>
      <SectionHeader iconLeft="Clock" renderRight={() => <ClearAll onClick={recentlyUsed.clear} />}>
        {t("platform.catalog.section.recentlyUsed")}
      </SectionHeader>

      <Scroll>
        {recentlyUsed.data.map(m => (
          <Flex key={m.id} margin={2}>
            <MinimumCard manifest={m} onClick={disclaimer.onSelect} />
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

function ClearAll({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation();

  return (
    <ClearAllContainer onClick={onClick} padding={2}>
      <Text color="primary.c80" fontSize={14}>
        {t("common.clearAll")}
      </Text>
    </ClearAllContainer>
  );
}

const ClearAllContainer = styled(Flex).attrs({ padding: 2 })`
  cursor: pointer;
`;

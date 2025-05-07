import React from "react";
import { Entry } from "../types";
import { Flex, Icons, Text } from "@ledgerhq/react-ui/index";
import { useTranslation } from "react-i18next";
import Illustration from "~/renderer/components/Illustration";
import styled from "styled-components";
import { rgba } from "~/renderer/styles/helpers";

type RowProps = {
  entryPoint: Entry;
  illustration: string;
  link: string;
  redirect: () => void;
};

export function Row({ entryPoint, link, illustration, redirect }: RowProps) {
  const { t } = useTranslation();
  const title = `nftEntryPoint.entry.${entryPoint}`;

  return (
    <StyledRow
      justifyContent={"space-between"}
      alignItems="center"
      padding="12px"
      onClick={redirect}
      data-testid={`nft-entry-point-${entryPoint}`}
    >
      <Flex>
        <Illustration lightSource={illustration} darkSource={illustration} size={48} />
        <Flex flexDirection="column" ml="12px">
          <Text fontSize="16px" fontWeight="semiBold" color="neutral.c100" variant="large">
            {t(title)}
          </Text>
          <Text variant="body" fontWeight="medium" color="neutral.c70">
            {link}
          </Text>
        </Flex>
      </Flex>

      <Icons.ChevronRight size="M" color="neutral.c100" />
    </StyledRow>
  );
}

const StyledRow = styled(Flex)`
  &:hover {
    cursor: pointer;
    background: ${p => rgba(p.theme.colors.wallet, 0.04)};
  }
`;

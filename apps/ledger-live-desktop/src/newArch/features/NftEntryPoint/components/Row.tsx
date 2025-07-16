import React from "react";
import { Entry } from "../types";
import { Flex, Icons, Text } from "@ledgerhq/react-ui/index";
import { Trans } from "react-i18next";
import Illustration from "~/renderer/components/Illustration";
import styled from "styled-components";
import { rgba } from "~/renderer/styles/helpers";

type RowProps = Readonly<{
  entryPoint: Entry;
  illustration: string;
  link: string;
  redirect: () => void;
}>;

export const Row = ({ entryPoint, link, illustration, redirect }: RowProps) => (
  <StyledRow
    justifyContent="space-between"
    alignItems="center"
    padding="12px"
    onClick={redirect}
    data-testid={`nft-entry-point-${entryPoint}`}
  >
    <Flex>
      <Illustration lightSource={illustration} darkSource={illustration} size={48} />
      <Flex flexDirection="column" ml="12px">
        <Text fontSize="16px" fontWeight="semiBold" color="neutral.c100" variant="large">
          <Trans i18nKey={`nftEntryPoint.entry.${entryPoint}`} />
        </Text>
        <Text variant="body" fontWeight="medium" color="neutral.c70">
          {link}
        </Text>
      </Flex>
    </Flex>
    <Icons.ChevronRight size="M" color="neutral.c100" />
  </StyledRow>
);

const StyledRow = styled(Flex)`
  &:hover {
    cursor: pointer;
    background: ${p => rgba(p.theme.colors.wallet, 0.04)};
  }
`;

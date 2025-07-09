import React, { useCallback } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { Box, Flex } from "@ledgerhq/react-ui";
import type { HederaAccount } from "@ledgerhq/live-common/families/hedera/types";
import { urls } from "~/config/urls";
import { openModal } from "~/renderer/actions/modals";
import Button from "~/renderer/components/Button";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import Text from "~/renderer/components/Text";
import TableContainer, { TableHeader } from "~/renderer/components/TableContainer";
import IconChartLine from "~/renderer/icons/ChartLine";
import { openURL } from "~/renderer/linking";
import styled from "styled-components";

export default function DelegationPlaceholder({ account }: { account: HederaAccount }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const onDelegate = useCallback(() => {
    dispatch(openModal("MODAL_HEDERA_DELEGATE", { account }));
  }, [account, dispatch]);

  const onHowItWorks = useCallback(() => {
    openURL(urls.hedera.staking);
  }, []);

  return (
    <TableContainer mb={6}>
      <TableHeader
        title={<Trans i18nKey="hedera.account.bodyHeader.delegatedPositions.header" />}
        titleProps={{ "data-e2e": "title_Staking" }}
      />
      <Wrapper>
        <Box style={{ maxWidth: "65%" }}>
          <Text ff="Inter|Medium|SemiBold" color="palette.text.shade60" fontSize={4}>
            <Trans i18nKey="delegation.delegationEarn" values={{ name: account.currency.name }} />
          </Text>
          <Box mt={2}>
            <LinkWithExternalIcon label={t("delegation.howItWorks")} onClick={onHowItWorks} />
          </Box>
        </Box>
        <Box>
          <Button primary id="account-delegate-button" onClick={onDelegate}>
            <Flex flexDirection="row" columnGap={1} alignItems="center">
              <IconChartLine size={12} />
              <Trans i18nKey="hedera.account.bodyHeader.delegatedPositions.header" />
            </Flex>
          </Button>
        </Box>
      </Wrapper>
    </TableContainer>
  );
}

const Wrapper = styled(Box).attrs(() => ({
  p: 3,
}))`
  border-radius: 4px;
  justify-content: space-between;
  align-items: center;
`;

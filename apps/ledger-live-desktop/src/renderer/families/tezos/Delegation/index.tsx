import React from "react";
import { useDispatch } from "LLD/hooks/redux";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { useBaker, useTezosStakingInfo } from "@ledgerhq/live-common/families/tezos/react";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { TokenAccount } from "@ledgerhq/types-live";
import { openURL } from "~/renderer/linking";
import { openModal } from "~/renderer/actions/modals";
import Text from "~/renderer/components/Text";
import Button from "~/renderer/components/Button";
import Box from "~/renderer/components/Box";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import IconChartLine from "~/renderer/icons/ChartLine";
import Header from "./Header";
import Row from "./Row";
import StakingSection from "./StakingSection";
import UnstakingSection from "./UnstakingSection";
import TableContainer, { TableHeader } from "~/renderer/components/TableContainer";
import type { Delegation, TezosAccount } from "@ledgerhq/live-common/families/tezos/types";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { urls } from "~/config/urls";

type Props = {
  account: TezosAccount | TokenAccount;
  parentAccount: TezosAccount | undefined | null;
};
const Wrapper = styled(Box).attrs(() => ({
  p: 3,
}))`
  border-radius: 4px;
  justify-content: space-between;
  align-items: center;
`;
const Delegation = ({ account, parentAccount }: Props) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const info = useTezosStakingInfo(account);
  const stakingEnabled = !!useFeature("lldTezosStaking")?.enabled;
  const fallbackBaker = useBaker(info.delegation?.address || info.delegateAddress || "");

  const stakingUrl = useLocalizedUrl(urls.stakingTezos);

  if (parentAccount || account.type !== "Account") {
    return null;
  }

  const ops = account.operations ?? [];
  const lastStake = ops.find(o => o?.type === "STAKE");

  const hasDelegation = !!info.delegation || !!info.delegateAddress;

  const onEarn = () => {
    if (stakingEnabled && !info.isStaked) {
      dispatch(openModal("MODAL_TEZOS_EARNING_CHOICE", { account, parentAccount }));
      return;
    }
    dispatch(openModal("MODAL_DELEGATE", { account, parentAccount }));
  };

  return (
    <>
      <TableContainer mb={6}>
        <TableHeader
          title={t("delegation.header")}
          titleProps={{
            "data-e2e": "title_Delegation",
          }}
        />
        {hasDelegation ? (
          <>
            <Header />
            <Row
              delegation={
                info.delegation ||
                ({
                  address: info.delegateAddress || "",
                  baker: fallbackBaker,
                  operation: {
                    hash: lastStake?.hash || "",
                    date: lastStake?.date || new Date(),
                  },
                  isPending: false,
                  receiveShouldWarnDelegation: false,
                  sendShouldWarnDelegation: false,
                } as Delegation)
              }
              account={account}
              parentAccount={parentAccount}
              stakingEnabled={stakingEnabled}
            />
          </>
        ) : (
          <Wrapper horizontal>
            <Box
              style={{
                maxWidth: "65%",
              }}
            >
              <Text ff="Inter|Medium|SemiBold" color="neutral.c70" fontSize={4}>
                {t("delegation.delegationEarn", {
                  name: account.currency.name,
                })}
              </Text>
              <Box mt={2}>
                <LinkWithExternalIcon
                  label={t("delegation.howItWorks")}
                  onClick={() => openURL(stakingUrl)}
                />
              </Box>
            </Box>
            <Box>
              <Button primary id={"account-delegate-button"} onClick={onEarn}>
                <Box horizontal flow={1} alignItems="center">
                  <IconChartLine size={12} />
                  <Box>{t("delegation.title")}</Box>
                </Box>
              </Button>
            </Box>
          </Wrapper>
        )}
      </TableContainer>
      {stakingEnabled && info.isStaked && <StakingSection account={account} info={info} />}
      {stakingEnabled && info.hasUnstaking && <UnstakingSection account={account} info={info} />}
    </>
  );
};
export default Delegation;

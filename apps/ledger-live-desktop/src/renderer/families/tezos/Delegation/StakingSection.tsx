import React, { useCallback } from "react";
import styled, { useTheme } from "styled-components";
import { Trans, useTranslation } from "react-i18next";
import { useDispatch } from "LLD/hooks/redux";
import { shortAddressPreview, getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { getAddressExplorer, getDefaultExplorerView } from "@ledgerhq/live-common/explorers";
import { useBaker } from "@ledgerhq/live-common/families/tezos/react";
import type { TezosStakingInfo } from "@ledgerhq/live-common/families/tezos/react";
import { TezosAccount } from "@ledgerhq/live-common/families/tezos/types";
import { openModal } from "~/renderer/actions/modals";
import { openURL } from "~/renderer/linking";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import CounterValue from "~/renderer/components/CounterValue";
import FormattedVal from "~/renderer/components/FormattedVal";
import Ellipsis from "~/renderer/components/Ellipsis";
import TableContainer, {
  HeaderWrapper as BaseHeaderWrapper,
  TableHeader,
} from "~/renderer/components/TableContainer";
import DropDownSelector, { DropDownItem } from "~/renderer/components/DropDownSelector";
import { IconsLegacy } from "@ledgerhq/react-ui";
import Plus from "~/renderer/icons/Plus";
import StopCircle from "~/renderer/icons/StopCircle";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import BakerImage from "../BakerImage";

const HeaderWrapper = styled(BaseHeaderWrapper)`
  > * {
    flex: 1;
    display: flex;
    align-items: center;
  }
  > *:first-of-type {
    flex: 1.5;
  }
  > *:last-of-type {
    flex: 0.5;
  }
`;

const RowWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 16px 20px;
  > * {
    display: flex;
    align-items: center;
    flex-direction: row;
  }
`;

const BakerCell = styled.div`
  flex: 1.5;
  color: ${p => p.theme.colors.neutral.c100};
  > :first-child {
    margin-right: 6px;
    border-radius: 50%;
  }
  cursor: pointer;
`;

const Base = styled.div`
  flex: 1;
`;

const CTA = styled.div`
  flex: 0.5;
  display: flex;
  justify-content: flex-end;
`;

const MenuButton = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 34px;
  height: 24px;
  cursor: pointer;
`;

const Item = styled(DropDownItem)`
  width: 160px;
  cursor: pointer;
  white-space: pre-wrap;
  justify-content: flex-start;
  align-items: center;
`;

type Props = {
  account: TezosAccount;
  info: TezosStakingInfo;
};

const StakingSection = ({ account, info }: Props) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const dispatch = useDispatch();
  const unit = useAccountUnit(account);
  const currency = getAccountCurrency(account);
  const { stakedBalance, delegateAddress } = info;
  const baker = useBaker(delegateAddress ?? "");

  const openBaker = useCallback(() => {
    if (!delegateAddress) return;
    const url = getAddressExplorer(getDefaultExplorerView(account.currency), delegateAddress);
    if (url) openURL(url);
  }, [delegateAddress, account.currency]);

  const items = [
    {
      key: "stakeMore",
      label: <Trans i18nKey="tezos.staking.contextMenu.stakeMore" />,
      icon: <Plus size={16} />,
      onClick: () => dispatch(openModal("MODAL_TEZOS_STAKE", { account, skipDelegation: true })),
    },
    {
      key: "unstake",
      label: <Trans i18nKey="tezos.staking.contextMenu.unstake" />,
      icon: <StopCircle size={16} />,
      onClick: () => dispatch(openModal("MODAL_TEZOS_UNSTAKE", { account })),
    },
  ];

  const renderItem = ({
    item,
  }: {
    item: { key: string; label: React.ReactNode; icon: React.ReactNode; onClick: () => void };
  }) => {
    const color = item.key === "unstake" ? "alertRed" : "neutral.c100";
    return (
      <Item horizontal flow={2} onClick={item.onClick}>
        <Box mr={12} color={color}>
          {item.icon}
        </Box>
        <Text ff="Inter|SemiBold" fontSize={3} color={color}>
          {item.label}
        </Text>
      </Item>
    );
  };

  const bakerName = baker ? baker.name : shortAddressPreview(delegateAddress ?? "");

  return (
    <TableContainer mb={6}>
      <TableHeader title={t("tezos.staking.header")} />
      <HeaderWrapper>
        <Text ff="Inter|SemiBold" color="neutral.c70" fontSize={3}>
          <Trans i18nKey="delegation.validator" />
        </Text>
        <Text ff="Inter|SemiBold" color="neutral.c70" fontSize={3}>
          <Trans i18nKey="delegation.amount" />
        </Text>
        <Text ff="Inter|SemiBold" color="neutral.c70" fontSize={3}>
          <Trans i18nKey="delegation.value" />
        </Text>
        <Text />
      </HeaderWrapper>
      <RowWrapper>
        <BakerCell onClick={openBaker}>
          <BakerImage baker={baker} />
          <Ellipsis ff="Inter|SemiBold" color="neutral.c100" fontSize={3}>
            {bakerName}
          </Ellipsis>
        </BakerCell>
        <Base>
          <FormattedVal
            ff="Inter|SemiBold"
            val={stakedBalance}
            unit={unit}
            showCode
            fontSize={3}
            color="neutral.c80"
          />
        </Base>
        <Base>
          <CounterValue
            ff="Inter|SemiBold"
            color="neutral.c80"
            fontSize={3}
            currency={currency}
            value={stakedBalance}
          />
        </Base>
        <CTA>
          <DropDownSelector items={items} renderItem={renderItem}>
            {() => (
              <MenuButton>
                <IconsLegacy.OthersMedium size={14} color={theme.colors.neutral.c70} />
              </MenuButton>
            )}
          </DropDownSelector>
        </CTA>
      </RowWrapper>
    </TableContainer>
  );
};

export default StakingSection;

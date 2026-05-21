import React, { useCallback, useMemo } from "react";
import styled from "styled-components";
import { Trans, useTranslation } from "react-i18next";
import { shortAddressPreview, getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { getAddressExplorer, getDefaultExplorerView } from "@ledgerhq/live-common/explorers";
import { isFinalizablePosition, useBaker } from "@ledgerhq/live-common/families/tezos/react";
import type { TezosStakingInfo } from "@ledgerhq/live-common/families/tezos/react";
import type { StakingPosition, TezosAccount } from "@ledgerhq/live-common/families/tezos/types";
import { openURL } from "~/renderer/linking";
import Text from "~/renderer/components/Text";
import CounterValue from "~/renderer/components/CounterValue";
import FormattedVal from "~/renderer/components/FormattedVal";
import Ellipsis from "~/renderer/components/Ellipsis";
import TableContainer, {
  HeaderWrapper as BaseHeaderWrapper,
  TableHeader,
} from "~/renderer/components/TableContainer";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { useDateFromNow } from "~/renderer/hooks/useDateFormatter";
import BakerImage from "../BakerImage";

const UNSTAKE_DELAY_MS = 4 * 24 * 60 * 60 * 1000;

const HeaderWrapper = styled(BaseHeaderWrapper)`
  > * {
    flex: 1;
    display: flex;
    align-items: center;
  }
  > *:first-of-type {
    flex: 1.5;
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

type CountdownProps = {
  createdAt: Date | undefined;
  isFinalizable: boolean;
};

const TimeRemaining = ({ createdAt, isFinalizable }: CountdownProps) => {
  const completionDate = useMemo(() => {
    if (!createdAt) return undefined;
    // Clock-skew clamp: remaining can't exceed the unstake delay.
    const cap = Date.now() + UNSTAKE_DELAY_MS;
    return new Date(Math.min(createdAt.getTime() + UNSTAKE_DELAY_MS, cap));
  }, [createdAt]);
  const fromNowText = useDateFromNow(completionDate);
  const isPast = !!completionDate && completionDate.getTime() <= Date.now();

  if (isFinalizable || isPast) {
    return (
      <Text ff="Inter|Medium" color="neutral.c80" fontSize={3}>
        <Trans i18nKey="tezos.unstaking.processing" />
      </Text>
    );
  }
  return (
    <Text ff="Inter|Medium" color="neutral.c80" fontSize={3}>
      {fromNowText || "—"}
    </Text>
  );
};

type RowProps = {
  position: StakingPosition;
  account: TezosAccount;
};

const UnstakingRow = ({ position, account }: RowProps) => {
  const unit = useAccountUnit(account);
  const currency = getAccountCurrency(account);
  const baker = useBaker(position.delegate ?? "");
  const isFinalizable = isFinalizablePosition(position.uid);

  const openBaker = useCallback(() => {
    if (!position.delegate) return;
    const url = getAddressExplorer(getDefaultExplorerView(account.currency), position.delegate);
    if (url) openURL(url);
  }, [position.delegate, account.currency]);

  const bakerName = baker ? baker.name : shortAddressPreview(position.delegate ?? "");

  return (
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
          val={position.amount}
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
          value={position.amount}
        />
      </Base>
      <Base>
        <TimeRemaining createdAt={position.createdAt} isFinalizable={isFinalizable} />
      </Base>
    </RowWrapper>
  );
};

type Props = {
  account: TezosAccount;
  info: TezosStakingInfo;
};

const UnstakingSection = ({ account, info }: Props) => {
  const { t } = useTranslation();
  const { unstakingPositions } = info;

  if (unstakingPositions.length === 0) return null;

  return (
    <TableContainer mb={6}>
      <TableHeader title={t("tezos.unstaking.header")} />
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
        <Text ff="Inter|SemiBold" color="neutral.c70" fontSize={3}>
          <Trans i18nKey="delegation.duration" />
        </Text>
      </HeaderWrapper>
      {unstakingPositions.map(position => (
        <UnstakingRow key={position.uid} position={position} account={account} />
      ))}
    </TableContainer>
  );
};

export default UnstakingSection;

import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import {
  useTotalMaturity,
  useTotalStaked,
  useTotalStakedMaturity,
} from "@ledgerhq/live-common/families/internet_computer/react";
import type { ICPAccount } from "@ledgerhq/live-common/families/internet_computer/types";
import type { TokenAccount } from "@ledgerhq/types-live";
import { useSelector } from "LLD/hooks/redux";
import React from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import Box from "~/renderer/components/Box/Box";
import Discreet, { useDiscreetMode } from "~/renderer/components/Discreet";
import Text from "~/renderer/components/Text";
import ToolTip from "~/renderer/components/Tooltip";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import InfoCircle from "~/renderer/icons/InfoCircle";
import { localeSelector } from "~/renderer/reducers/settings";

const Wrapper = styled(Box).attrs(() => ({
  horizontal: true,
  mt: 4,
  p: 5,
  pb: 0,
  scroll: true,
}))`
  border-top: 1px solid ${p => p.theme.colors.neutral.c30};
`;

const Detail = ({
  label,
  tooltip,
  value,
  testId,
}: {
  label: string;
  tooltip: string;
  value: string;
  testId: string;
}) => (
  <Box flex="0.25 0 auto" alignItems="start" paddingRight={20}>
    <ToolTip content={<Trans i18nKey={tooltip} />}>
      <Box horizontal alignItems="center" mb={1}>
        <Text fontSize={4} ff="Inter|Medium" color="neutral.c70" lineHeight="20px" mr={1}>
          <Trans i18nKey={label} />
        </Text>
        <InfoCircle size={13} />
      </Box>
    </ToolTip>
    <Text fontSize={6} ff="Inter|SemiBold" color="neutral.c100" data-testid={testId}>
      <Discreet>{value}</Discreet>
    </Text>
  </Box>
);

// Split out so the neuron hooks run unconditionally against a narrowed ICPAccount: the family slot
// is typed `ICPAccount | TokenAccount`, and narrowing in the caller would make the hooks conditional.
const Footer = ({ account }: { account: ICPAccount }) => {
  const discreet = useDiscreetMode();
  const locale = useSelector(localeSelector);
  const unit = useAccountUnit(account);
  const totalStaked = useTotalStaked(account);
  const liquidMaturity = useTotalMaturity(account);
  const stakedMaturity = useTotalStakedMaturity(account);

  // Both halves, as the tooltip promises. Staked maturity appears nowhere else — neuronStake excludes
  // it — so summing only the liquid half leaves it invisible.
  const totalMaturity = liquidMaturity.plus(stakedMaturity);

  if (totalStaked.isZero() && totalMaturity.isZero()) return null;

  const format = (value: typeof totalStaked) =>
    formatCurrencyUnit(unit, value, {
      alwaysShowSign: false,
      showCode: true,
      discreet,
      locale,
    });

  return (
    <Wrapper>
      <Detail
        label="internetComputer.summaryFooter.stakedBalance"
        tooltip="internetComputer.summaryFooter.stakedBalanceTooltip"
        value={format(totalStaked)}
        testId="icp-staked-balance"
      />
      <Detail
        label="internetComputer.summaryFooter.totalMaturity"
        tooltip="internetComputer.summaryFooter.totalMaturityTooltip"
        value={format(totalMaturity)}
        testId="icp-total-maturity"
      />
    </Wrapper>
  );
};

type Props = {
  account: ICPAccount | TokenAccount;
};

const AccountBalanceSummaryFooter = ({ account }: Props) =>
  account.type === "Account" ? <Footer account={account} /> : null;

export default AccountBalanceSummaryFooter;

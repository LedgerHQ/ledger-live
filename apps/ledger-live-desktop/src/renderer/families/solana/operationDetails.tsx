import React from "react";
import { Trans } from "react-i18next";
import { useSelector } from "react-redux";
import BigNumber from "bignumber.js";
import { getAddressExplorer, getDefaultExplorerView } from "@ledgerhq/live-common/explorers";
import { CryptoCurrency, Unit } from "@ledgerhq/types-cryptoassets";
import { getAccountUnit } from "@ledgerhq/live-common/account/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { SolanaAccount, SolanaOperation } from "@ledgerhq/live-common/families/solana/types";
import { useSolanaPreloadData } from "@ledgerhq/live-common/families/solana/react";
import Box from "~/renderer/components/Box/Box";
import { useDiscreetMode } from "~/renderer/components/Discreet";
import Text from "~/renderer/components/Text";
import Ellipsis from "~/renderer/components/Ellipsis";
import {
  Address,
  OpDetailsData,
  OpDetailsSection,
  OpDetailsTitle,
  OpDetailsVoteData,
} from "~/renderer/drawers/OperationDetails/styledComponents";
import { localeSelector } from "~/renderer/reducers/settings";
import { openURL } from "~/renderer/linking";
import { OperationDetailsExtraProps } from "../types";

export const redirectAddress = (currency: CryptoCurrency, address: string) => () => {
  const url = getAddressExplorer(getDefaultExplorerView(currency), address);
  if (url) openURL(url);
};

function useFormatAmount() {
  const discreet = useDiscreetMode();
  const locale = useSelector(localeSelector);
  const formatConfig = {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
    discreet,
    locale,
  };

  return (unit: Unit, amount: BigNumber) => {
    return formatCurrencyUnit(unit, amount, formatConfig);
  };
}

type SolanaOperationDetailsExtraProps = OperationDetailsExtraProps<SolanaAccount, SolanaOperation>;
type DelegateExtraFieldsProps = {
  account: SolanaAccount;
  voteAddress: string;
  amount: BigNumber;
};

const DelegateExtraFields = ({ account, voteAddress, amount }: DelegateExtraFieldsProps) => {
  const unit = getAccountUnit(account);
  const formatAmount = useFormatAmount();
  const preloadData = useSolanaPreloadData(account.currency);
  const validator = preloadData?.validators.find(v => v.voteAccount === voteAddress);

  return (
    <OpDetailsSection gap="80px">
      <OpDetailsTitle>
        <Trans i18nKey={"operationDetails.extra.validators"} />
      </OpDetailsTitle>
      <OpDetailsData>
        <OpDetailsVoteData>
          <Box>
            <Ellipsis>
              <Trans
                i18nKey="operationDetails.extra.votesAddress"
                values={{
                  votes: formatAmount(unit, amount),
                  name: validator?.name || voteAddress,
                }}
              >
                <Text ff="Inter|SemiBold">{""}</Text>
                {""}
                <Text ff="Inter|SemiBold">{""}</Text>
              </Trans>
            </Ellipsis>
          </Box>
          <Address
            style={{ maxWidth: "95%" }}
            onClick={redirectAddress(account.currency, voteAddress)}
          >
            <Ellipsis>{voteAddress}</Ellipsis>
          </Address>
        </OpDetailsVoteData>
      </OpDetailsData>
    </OpDetailsSection>
  );
};

type WithdrawExtraFieldsProps = {
  account: SolanaAccount;
  fromAddress: string;
  amount: BigNumber;
};
const WithdrawExtraFields = ({ account, fromAddress, amount }: WithdrawExtraFieldsProps) => {
  const unit = getAccountUnit(account);
  const formatAmount = useFormatAmount();

  return (
    <>
      <OpDetailsSection>
        <OpDetailsTitle>
          <Trans i18nKey={"operationDetails.extra.withdrawnFrom"} />
        </OpDetailsTitle>
        <OpDetailsData>
          <Ellipsis>{fromAddress}</Ellipsis>
        </OpDetailsData>
      </OpDetailsSection>

      <OpDetailsSection>
        <OpDetailsTitle>
          <Trans i18nKey="operationDetails.extra.withdrawnAmount" />
        </OpDetailsTitle>
        <OpDetailsData>{formatAmount(unit, amount)}</OpDetailsData>
      </OpDetailsSection>
    </>
  );
};

const OperationStakeDetails = ({ account, operation, type }: SolanaOperationDetailsExtraProps) => {
  if (!operation.extra.stake) return null;
  const { address, amount } = operation.extra.stake;
  switch (type) {
    case "DELEGATE": {
      return <DelegateExtraFields account={account} voteAddress={address} amount={amount} />;
    }
    case "WITHDRAW_UNBONDED": {
      return <WithdrawExtraFields account={account} fromAddress={address} amount={amount} />;
    }
    default:
      return null;
  }
};

const OperationDetailsMemo = ({ memo }: { memo: string }) => {
  return (
    <OpDetailsSection>
      <OpDetailsTitle>
        <Trans i18nKey={"operationDetails.extra.memo"} />
      </OpDetailsTitle>
      <OpDetailsData>
        <Ellipsis ml={2}>{memo}</Ellipsis>
      </OpDetailsData>
    </OpDetailsSection>
  );
};

const OperationDetailsExtra = ({ type, account, operation }: SolanaOperationDetailsExtraProps) => {
  return (
    <>
      {!!operation.extra.memo && <OperationDetailsMemo memo={operation.extra.memo} />}
      <OperationStakeDetails type={type} account={account} operation={operation} />
    </>
  );
};

export default {
  OperationDetailsExtra,
};

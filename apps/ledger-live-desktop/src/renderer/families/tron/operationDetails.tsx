/* eslint-disable consistent-return */
import React, { useCallback } from "react";
import { BigNumber } from "bignumber.js";
import { Operation } from "@ledgerhq/types-live";
import { Currency, Unit } from "@ledgerhq/types-cryptoassets";
import { TronAccount, TronOperation, Vote } from "@ledgerhq/live-common/families/tron/types";
import { getDefaultExplorerView, getAddressExplorer } from "@ledgerhq/live-common/explorers";
import { openURL } from "~/renderer/linking";
import {
  OpDetailsTitle,
  Address,
  OpDetailsData,
  OpDetailsVoteData,
  OpDetailsSection,
} from "~/renderer/drawers/OperationDetails/styledComponents";
import { Trans } from "react-i18next";
import Box from "~/renderer/components/Box/Box";
import {
  useTronSuperRepresentatives,
  formatVotes,
} from "@ledgerhq/live-common/families/tron/react";
import Text from "~/renderer/components/Text";
import FormattedVal from "~/renderer/components/FormattedVal";
import CounterValue from "~/renderer/components/CounterValue";
import { useDiscreetMode } from "~/renderer/components/Discreet";
import { OperationDetailsExtraProps } from "../types";
const helpURL = "https://support.ledger.com/hc/en-us/articles/360013062139";

function getURLFeesInfo({ op }: { op: Operation; currencyId: string }): string | undefined {
  if (op.fee.gt(200000)) {
    return helpURL;
  }
}

function getURLWhatIsThis({ op }: { op: Operation; currencyId: string }): string | undefined {
  if (op.type !== "IN" && op.type !== "OUT") {
    return helpURL;
  }
}

type OperationsDetailsVotesProps = {
  votes: Array<Vote> | undefined | null;
  account: TronAccount;
  isTransactionField?: boolean;
};
export const OperationDetailsVotes = ({
  votes,
  account,
  isTransactionField,
}: OperationsDetailsVotesProps) => {
  const sp = useTronSuperRepresentatives();
  const formattedVotes = formatVotes(votes, sp);
  const redirectAddress = useCallback(
    (address: string) => {
      const url = getAddressExplorer(getDefaultExplorerView(account.currency), address);
      if (url) openURL(url);
    },
    [account],
  );
  const discreet = useDiscreetMode();
  return (
    <OpDetailsSection>
      {!isTransactionField && (
        <OpDetailsTitle>
          <Trans
            i18nKey={"operationDetails.extra.votes"}
            values={{
              number: votes && votes.length,
            }}
          />
        </OpDetailsTitle>
      )}
      <Box>
        {sp.length > 0 &&
          formattedVotes &&
          formattedVotes.length > 0 &&
          formattedVotes.map(({ voteCount, address, validator }, i) => (
            <OpDetailsData key={address + i} justifyContent="flex-start">
              <OpDetailsVoteData>
                <Box>
                  <Text>
                    <Trans
                      i18nKey="operationDetails.extra.votesAddress"
                      values={{
                        votes: !discreet ? voteCount : "***",
                        name: validator && validator.name,
                      }}
                    >
                      <Text ff="Inter|SemiBold">{""}</Text>
                      {""}
                      <Text ff="Inter|SemiBold">{""}</Text>
                    </Trans>
                  </Text>
                </Box>
                <Address onClick={() => redirectAddress(address)}>{address}</Address>
              </OpDetailsVoteData>
            </OpDetailsData>
          ))}
      </Box>
    </OpDetailsSection>
  );
};

const OperationDetailsExtra = ({
  operation,
  type,
  account,
}: OperationDetailsExtraProps<TronAccount, TronOperation>) => {
  const frozenAmount = operation.extra?.frozenAmount
    ? (operation.extra.frozenAmount as BigNumber)
    : new BigNumber(0);

  const unfreezeAmount = operation.extra?.unfreezeAmount
    ? (operation.extra.unfreezeAmount as BigNumber)
    : new BigNumber(10);

  const unDelegatedAmount = operation.extra?.unDelegatedAmount
    ? (operation.extra.unDelegatedAmount as BigNumber)
    : new BigNumber(0);

  const receiverAddress = operation.extra?.receiverAddress ? operation.extra.receiverAddress : "";

  const redirectAddress = useCallback(
    (address: string) => {
      const url = getAddressExplorer(getDefaultExplorerView(account.currency), address);
      if (url) openURL(url);
    },
    [account],
  );

  switch (type) {
    case "VOTE": {
      const votes = operation.extra?.votes;
      if (!votes || !votes.length) return null;
      return <OperationDetailsVotes votes={votes} account={account} />;
    }
    case "FREEZE":
      return (
        <OpDetailsSection>
          <OpDetailsTitle>
            <Trans i18nKey="operationDetails.extra.frozenAmount" />
          </OpDetailsTitle>
          <OpDetailsData>
            <Box>
              <FormattedVal
                val={frozenAmount}
                unit={account.unit}
                showCode
                fontSize={4}
                color="palette.text.shade60"
              />
            </Box>
          </OpDetailsData>
        </OpDetailsSection>
      );
    case "UNFREEZE":
      return (
        <OpDetailsSection>
          <OpDetailsTitle>
            <Trans i18nKey="operationDetails.extra.unfreezeAmount" />
          </OpDetailsTitle>
          <OpDetailsData>
            <Box>
              <FormattedVal
                val={unfreezeAmount}
                unit={account.unit}
                showCode
                fontSize={4}
                color="palette.text.shade60"
              />
            </Box>
          </OpDetailsData>
        </OpDetailsSection>
      );
    case "UNDELEGATE_RESOURCE":
      return (
        <>
          <OpDetailsSection>
            <OpDetailsTitle>
              <Trans i18nKey="operationDetails.extra.undelegatedAmount" />
            </OpDetailsTitle>
            <OpDetailsData>
              <Box>
                <FormattedVal
                  val={unDelegatedAmount}
                  unit={account.unit}
                  showCode
                  fontSize={4}
                  color="palette.text.shade60"
                />
              </Box>
            </OpDetailsData>
          </OpDetailsSection>
          <OpDetailsSection>
            <OpDetailsTitle>
              <Trans i18nKey="operationDetails.extra.undelegatedFrom" />
            </OpDetailsTitle>
            <OpDetailsData>
              <Box>
                <Address onClick={() => redirectAddress(receiverAddress)}>
                  {receiverAddress}
                </Address>
              </Box>
            </OpDetailsData>
          </OpDetailsSection>
        </>
      );
    case "LEGACY_UNFREEZE":
      return (
        <OpDetailsSection>
          <OpDetailsTitle>
            <Trans i18nKey="operationDetails.extra.unfreezeAmount" />
          </OpDetailsTitle>
          <OpDetailsData>
            <Box>
              <FormattedVal
                val={unfreezeAmount}
                unit={account.unit}
                showCode
                fontSize={4}
                color="palette.text.shade60"
              />
            </Box>
          </OpDetailsData>
        </OpDetailsSection>
      );
    default:
      return null;
  }
};

type Props = {
  operation: TronOperation;
  currency: Currency;
  unit: Unit;
};
const FreezeAmountCell = ({ operation, currency, unit }: Props) => {
  const amount = operation.extra?.frozenAmount;
  return amount && !amount.isZero() ? (
    <>
      <FormattedVal val={amount} unit={unit} showCode fontSize={4} color={"palette.text.shade80"} />

      <CounterValue
        color="palette.text.shade60"
        fontSize={3}
        date={operation.date}
        currency={currency}
        value={amount}
      />
    </>
  ) : null;
};

const UnfreezeAmountCell = ({ operation, currency, unit }: Props) => {
  const amount = operation.extra?.unfreezeAmount;
  return amount && !amount.isZero() ? (
    <>
      <FormattedVal val={amount} unit={unit} showCode fontSize={4} color={"palette.text.shade80"} />

      <CounterValue
        color="palette.text.shade60"
        fontSize={3}
        date={operation.date}
        currency={currency}
        value={amount}
      />
    </>
  ) : null;
};
const VoteAmountCell = ({ operation }: Props) => {
  const discreet = useDiscreetMode();
  const votes = operation.extra?.votes;
  const amount =
    votes &&
    votes.reduce((sum: number, { voteCount }: { voteCount: number }) => sum + voteCount, 0);
  return amount && amount > 0 ? (
    <Text ff="Inter|SemiBold" fontSize={4}>
      <Trans
        i18nKey={"operationDetails.extra.votes"}
        values={{
          number: !discreet ? amount : "***",
        }}
      />
    </Text>
  ) : null;
};
const amountCellExtra = {
  FREEZE: FreezeAmountCell,
  UNFREEZE: UnfreezeAmountCell,
  LEGACY_UNFREEZE: UnfreezeAmountCell,
  VOTE: VoteAmountCell,
};
export default {
  getURLFeesInfo,
  getURLWhatIsThis,
  OperationDetailsExtra,
  amountCellExtra,
};

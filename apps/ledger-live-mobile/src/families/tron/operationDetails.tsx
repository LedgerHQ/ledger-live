import React, { useCallback } from "react";
import { StyleSheet, Linking } from "react-native";
import { Trans, useTranslation } from "react-i18next";
import { BigNumber } from "bignumber.js";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import {
  getDefaultExplorerView,
  getAddressExplorer,
} from "@ledgerhq/live-common/explorers";
import {
  formatVotes,
  useTronSuperRepresentatives,
} from "@ledgerhq/live-common/families/tron/react";
import type { Vote } from "@ledgerhq/live-common/families/tron/types";
import type { Account, Operation } from "@ledgerhq/types-live";
import type { Currency, Unit } from "@ledgerhq/types-cryptoassets";
import { useSelector } from "react-redux";
import LText from "../../components/LText";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import CounterValue from "../../components/CounterValue";
import DelegationInfo from "../../components/DelegationInfo";
import Section from "../../screens/OperationDetails/Section";
import { discreetModeSelector, localeSelector } from "../../reducers/settings";

const helpURL = "https://support.ledger.com/hc/en-us/articles/360013062139";

function getURLWhatIsThis(
  op: Operation,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  currencyId: string,
): string | null | undefined {
  if (op.type !== "IN" && op.type !== "OUT") {
    return helpURL;
  }

  return undefined;
}

type OperationDetailsExtraProps = {
  extra: {
    votes: Array<Vote>;
    frozenAmount: BigNumber;
    unfreezeAmount: BigNumber;
  };
  type: string;
  account: Account;
};

function OperationDetailsExtra({
  extra,
  type,
  account,
}: OperationDetailsExtraProps) {
  const { t } = useTranslation();
  const discreet = useSelector(discreetModeSelector);
  const locale = useSelector(localeSelector);

  switch (type) {
    case "VOTE": {
      const { votes } = extra;
      if (!votes || !votes.length) return null;
      return <OperationDetailsVotes votes={votes} account={account} />;
    }

    case "FREEZE": {
      const value = formatCurrencyUnit(
        account.unit,
        new BigNumber(extra.frozenAmount),
        {
          showCode: true,
          discreet,
          locale,
        },
      );
      return (
        <Section
          title={t("operationDetails.extra.frozenAmount")}
          value={value}
        />
      );
    }

    case "UNFREEZE": {
      const value = formatCurrencyUnit(
        account.unit,
        new BigNumber(extra.unfreezeAmount),
        {
          showCode: true,
          discreet,
          locale,
        },
      );
      return (
        <Section
          title={t("operationDetails.extra.unfreezeAmount")}
          value={value}
        />
      );
    }

    default:
      return null;
  }
}

type OperationsDetailsVotesProps = {
  votes: Array<Vote>;
  account: Account;
};

function OperationDetailsVotes({
  votes,
  account,
}: OperationsDetailsVotesProps) {
  const { t } = useTranslation();
  const sp = useTronSuperRepresentatives();
  const locale = useSelector(localeSelector);
  const formattedVotes = formatVotes(votes, sp);
  const redirectAddressCreator = useCallback(
    address => () => {
      const url = getAddressExplorer(
        getDefaultExplorerView(account.currency),
        address,
      );
      if (url) Linking.openURL(url);
    },
    [account],
  );
  return (
    <Section
      title={t("operationDetails.extra.votes", {
        number: votes.length,
      })}
    >
      {formattedVotes &&
        formattedVotes.map(({ address, voteCount, validator }, i) => (
          <DelegationInfo
            key={address + i}
            address={address}
            name={validator?.name ?? address}
            formattedAmount={voteCount.toLocaleString(locale)}
            onPress={redirectAddressCreator(address)}
          />
        ))}
    </Section>
  );
}

type Props = {
  operation: Operation;
  currency: Currency;
  unit: Unit;
};

const AmountCell = ({
  amount,
  unit,
  currency,
  operation,
}: Props & {
  amount: BigNumber;
}) =>
  !amount.isZero() ? (
    <>
      <LText semiBold numberOfLines={1} style={styles.topText}>
        <CurrencyUnitValue
          showCode
          unit={unit}
          value={amount}
          alwaysShowSign={false}
        />
      </LText>

      <LText numberOfLines={1} style={styles.amountText} color="grey">
        <CounterValue
          showCode
          date={operation.date}
          currency={currency}
          value={amount}
          alwaysShowSign={false}
          withPlaceholder
        />
      </LText>
    </>
  ) : null;

const FreezeAmountCell = ({ operation, currency, unit }: Props) => {
  const amount = new BigNumber(
    operation.extra ? operation.extra.frozenAmount : 0,
  );
  return (
    <AmountCell
      amount={amount}
      operation={operation}
      currency={currency}
      unit={unit}
    />
  );
};

const UnfreezeAmountCell = ({ operation, currency, unit }: Props) => {
  const amount = new BigNumber(
    operation.extra ? operation.extra.unfreezeAmount : 0,
  );
  return (
    <AmountCell
      amount={amount}
      operation={operation}
      currency={currency}
      unit={unit}
    />
  );
};

const VoteAmountCell = ({ operation }: Props) => {
  const amount =
    operation.extra && operation.extra.votes
      ? (operation.extra.votes as Vote[]).reduce(
          (sum, { voteCount }) => sum + voteCount,
          0,
        )
      : 0;
  return amount > 0 ? (
    <LText numberOfLines={1} semiBold style={[styles.topText, styles.voteText]}>
      <Trans
        i18nKey={"operationDetails.extra.votes"}
        values={{
          number: amount,
        }}
      />
    </LText>
  ) : null;
};

const styles = StyleSheet.create({
  amountText: {
    fontSize: 14,
    flex: 1,
  },
  topText: {
    fontSize: 14,
    flex: 1,
  },
  voteText: {
    lineHeight: 40,
  },
});
const amountCell = {
  FREEZE: FreezeAmountCell,
  UNFREEZE: UnfreezeAmountCell,
  VOTE: VoteAmountCell,
};
export default {
  getURLWhatIsThis,
  OperationDetailsExtra,
  amountCell,
};

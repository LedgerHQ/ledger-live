// @flow

import React, { useCallback } from "react";
import { View, StyleSheet, TouchableOpacity, Linking } from "react-native";
import { translate, Trans } from "react-i18next";
import type { TFunction } from "react-i18next";
import { BigNumber } from "bignumber.js";
import { formatCurrencyUnit } from "@ledgerhq/live-common/lib/currencies";
import {
  getDefaultExplorerView,
  getAddressExplorer,
} from "@ledgerhq/live-common/lib/explorers";
import {
  formatVotes,
  useTronSuperRepresentatives,
} from "@ledgerhq/live-common/lib/families/tron/react";
import type { Vote } from "@ledgerhq/live-common/lib/families/tron/types";
import type { Account, Operation } from "@ledgerhq/live-common/lib/types";
import LText from "../../components/LText";
import Section from "../../screens/OperationDetails/Section";
import colors from "../../colors";

const helpURL = "https://support.ledger.com/hc/en-us/articles/360010653260";

function getURLWhatIsThis(op: Operation): ?string {
  if (op.type !== "IN" && op.type !== "OUT") {
    return helpURL;
  }
  return undefined;
}

type OperationDetailsExtraProps = {
  extra: { [key: string]: any },
  type: string,
  account: Account,
  t: TFunction,
};

function OperationDetailsExtra({
  extra,
  type,
  account,
  t,
}: OperationDetailsExtraProps) {
  switch (type) {
    case "VOTE": {
      const { votes } = extra;
      if (!votes || !votes.length) return null;

      return <OperationDetailsVotes votes={votes} account={account} t={t} />;
    }
    case "FREEZE": {
      const value = formatCurrencyUnit(
        account.unit,
        BigNumber(extra.frozenAmount),
        { showCode: true },
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
        BigNumber(extra.unfreezeAmount),
        { showCode: true },
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
  votes: Array<Vote>,
  account: Account,
  t: TFunction,
};

function OperationDetailsVotes({
  votes,
  account,
  t,
}: OperationsDetailsVotesProps) {
  const sp = useTronSuperRepresentatives();
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
      title={t("operationDetails.extra.votes", { number: votes.length })}
    >
      {formattedVotes &&
        formattedVotes.map(({ address, voteCount, validator }, i) => (
          <View key={address + i} style={styles.voteWrapper}>
            <View style={styles.voteCountWrapper}>
              <LText style={styles.greyText}>
                <Trans
                  i18nKey="operationDetails.extra.votesAddress"
                  values={{
                    votes: voteCount,
                    name: validator && validator.name,
                  }}
                >
                  <LText semiBold style={styles.text}>
                    text
                  </LText>
                </Trans>
              </LText>
            </View>

            <TouchableOpacity onPress={redirectAddressCreator(address)}>
              <LText style={styles.greyText}>{address}</LText>
            </TouchableOpacity>
          </View>
        ))}
    </Section>
  );
}

const styles = StyleSheet.create({
  voteWrapper: {
    borderLeftWidth: 3,
    borderLeftColor: colors.fog,
    paddingLeft: 16,
    marginBottom: 24,
  },
  text: {
    color: colors.darkBlue,
  },
  greyText: { color: colors.grey },
  voteCountWrapper: {
    marginBottom: 6,
  },
});

export default {
  getURLWhatIsThis,
  OperationDetailsExtra: translate()(OperationDetailsExtra),
};

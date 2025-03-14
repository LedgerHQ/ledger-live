import React, { memo, useMemo } from "react";

import { StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import { isLoaded } from "@ledgerhq/domain-service/hooks/logic";
import { useDomain } from "@ledgerhq/domain-service/hooks/index";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import SummaryRowCustom from "./SummaryRowCustom";
import Circle from "~/components/Circle";
import LText from "~/components/LText";
import QrCode from "@ledgerhq/icons-ui/native/QrCode";

type Props = {
  transaction: Transaction;
  currency: CryptoCurrency;
};

const DefaultRecipientTemplate = memo(({ transaction }: Pick<Props, "transaction">) => {
  const { recipient, recipientDomain } = transaction;

  return (
    <>
      <LText numberOfLines={2} style={styles.domainRowText} testID="send-summary-recipient-ens">
        {recipientDomain?.domain}
      </LText>
      <LText
        numberOfLines={2}
        style={recipientDomain ? styles.domainRowText : styles.summaryRowText}
        color={recipientDomain ? "neutral.c70" : "neutral.c100"}
        testID="send-summary-recipient"
      >
        {recipient}
      </LText>
    </>
  );
});
DefaultRecipientTemplate.displayName = "DefaultRecipientTemplate";

const RecipientWithResolutionTemplate = memo(({ transaction }: Pick<Props, "transaction">) => {
  const { recipient } = transaction;

  const domainResolution = useDomain(recipient, "ens");
  const recipientDomain = useMemo(
    () => (isLoaded(domainResolution) ? domainResolution.resolutions[0] : undefined),
    [domainResolution],
  );

  return (
    <>
      <LText numberOfLines={2} style={styles.domainRowText} testID="send-summary-recipient-ens">
        {recipientDomain?.domain}
      </LText>
      <LText
        numberOfLines={2}
        style={recipientDomain ? styles.domainRowText : styles.summaryRowText}
        color={recipientDomain ? "neutral.c70" : "neutral.c100"}
        testID="send-summary-recipient"
      >
        {recipient}
      </LText>
    </>
  );
});
RecipientWithResolutionTemplate.displayName = "RecipientWithResolutionTemplate";

function SummaryToSection({ transaction, currency }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const { enabled: isDomainResolutionEnabled, params } = useFeature("domainInputResolution") ?? {};
  const isCurrencySupported = params?.supportedCurrencyIds?.includes(currency.id) || false;

  const shouldTryResolvingDomain = useMemo(() => {
    if (transaction.recipientDomain) {
      return false;
    }
    return !!isDomainResolutionEnabled && isCurrencySupported;
  }, [transaction.recipientDomain, isDomainResolutionEnabled, isCurrencySupported]);

  return (
    <SummaryRowCustom
      label={t("send.summary.to")}
      iconLeft={
        <Circle bg={colors.palette.opacityDefault.c05} size={34}>
          <QrCode size="S" color={colors.palette.primary.c80} />
        </Circle>
      }
      data={
        shouldTryResolvingDomain ? (
          <RecipientWithResolutionTemplate transaction={transaction} />
        ) : (
          <DefaultRecipientTemplate transaction={transaction} />
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  summaryRowText: {
    fontSize: 16,
  },
  domainRowText: {
    fontSize: 14,
  },
  addressRowText: {
    fontSize: 14,
  },
});
export default memo<Props>(SummaryToSection);

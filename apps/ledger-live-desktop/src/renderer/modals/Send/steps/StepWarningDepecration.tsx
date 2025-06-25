import React, { useState } from "react";
// import { Trans } from "react-i18next";
import styled from "styled-components";
// import {
//   getAccountCurrency,
//   getFeesCurrency,
//   getFeesUnit,
//   getMainAccount,
// } from "@ledgerhq/live-common/account/index";
// import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import { Button, Checkbox, Icons, Text, IconsLegacy, Link } from "@ledgerhq/react-ui";
// import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
// import Ellipsis from "~/renderer/components/Ellipsis";
// import FormattedVal from "~/renderer/components/FormattedVal";
// import Text from "~/renderer/components/Text";
// import TranslatedError from "~/renderer/components/TranslatedError";
// import IconExclamationCircle from "~/renderer/icons/ExclamationCircle";
// import IconQrCode from "~/renderer/icons/QrCode";
// import IconWallet from "~/renderer/icons/Wallet";
import { rgba } from "~/renderer/styles/helpers";
// import CounterValue from "~/renderer/components/CounterValue";
// import Alert from "~/renderer/components/Alert";
// import NFTSummary from "~/renderer/screens/nft/Send/Summary";
import { StepProps } from "../types";
import { openURL } from "~/renderer/linking";
import { useTranslation } from "react-i18next";
// import AccountTagDerivationMode from "~/renderer/components/AccountTagDerivationMode";
// import { getLLDCoinFamily } from "~/renderer/families";
// import { useMaybeAccountUnit } from "~/renderer/hooks/useAccountUnit";
// import { useMaybeAccountName } from "~/renderer/reducers/wallet";
// import MemoIcon from "~/renderer/icons/MemoIcon";
// import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
// import { getMemoTagValueByTransactionFamily } from "LLD/features/MemoTag/utils";
import InfoCircleFull from "~/renderer/icons/InfoCircleFull";
// import IconError from "~/renderer/icons/Error";

import { SubTitle, Title } from "~/renderer/components/DeviceAction/rendering";

const Circle = styled.div`
  padding: 16px;
  border-radius: 100px;
  background-color: ${p => rgba(p.theme.colors.palette.primary.c80, 0.1)};
  align-items: center;
  gap: 10px;
  display: flex;
  align-self: center;
  justify-content: center;
  width: fit-content;
  height: fit-content;
`;

const SmallCheckboxWrapper = styled.div`
  transform: scale(0.5);
  transform-origin: top left;
`;

// const WARN_FROM_UTXO_COUNT = 50;

const StepWarningDepecration = (props: StepProps) => {
  const [isChecked, setIsChecked] = useState(false);
  const handleChange = (checked: boolean) => {
    console.log("checked:", checked);
    setIsChecked(checked);
  };
  const { t } = useTranslation();
  const deadline = new Date("2025-07-01");
  const today = new Date();
  const date = deadline.toLocaleDateString();
  const isPast = today > deadline;
  const canClearSign = true;
  const { account, parentAccount, transaction, status, currencyName, isNFTSend, transitionTo } =
    props;
  // const mainAccount = account && getMainAccount(account, parentAccount);
  // const unit = useMaybeAccountUnit(account);
  // const accountName = useMaybeAccountName(account);
  // const lldMemoTag = useFeature("lldMemoTag");

  // if (!account || !mainAccount || !transaction) {
  //   return null;
  // }
  // const { estimatedFees, amount, totalSpent, warnings } = status;
  // const txInputs = "txInputs" in status ? status.txInputs : undefined;
  // const currency = getAccountCurrency(account);
  // const feesCurrency = getFeesCurrency(mainAccount);
  // const feesUnit = getFeesUnit(feesCurrency);
  // const utxoLag = txInputs ? txInputs.length >= WARN_FROM_UTXO_COUNT : null;
  // const hasNonEmptySubAccounts =
  //   account.type === "Account" &&
  //   (account.subAccounts || []).some(subAccount => subAccount.balance.gt(0));

  // const specific = currency ? getLLDCoinFamily(mainAccount.currency.family) : null;
  // const SpecificSummaryAdditionalRows = specific?.StepSummaryAdditionalRows;

  // const memo = lldMemoTag?.enabled
  //   ? getMemoTagValueByTransactionFamily(transaction)
  //   : (
  //       transaction as Transaction & {
  //         memo: string;
  //       }
  //     )?.memo;
  // const handleOnEditMemo = () => {
  //   transitionTo("recipient");
  // };

  return (
    <Box flow={4} mx={40}>
      <Circle>
        {isPast ? (
          canClearSign ? (
            <Icons.WarningFill size="L" color="palette.warning.c70" />
          ) : (
            <IconsLegacy.CircledCrossSolidMedium size={40} color="error.c60" />
          )
        ) : (
          <Icons.InformationFill size="L" color="primary.c80" />
        )}
      </Circle>
      <Text fontWeight="600" textAlign="center" fontSize={24}>
        {isPast
          ? canClearSign
            ? t("lnsDeprecation.warning.title")
            : t("lnsDeprecation.error.title")
          : t("lnsDeprecation.info.title", {
              date,
              coinName: currencyName,
            })}
      </Text>
      <Text color="palette.text.shade60" textAlign="center" fontWeight="500" fontSize={14}>
        {isPast
          ? canClearSign
            ? t("lnsDeprecation.warning.subtitle")
            : t("lnsDeprecation.error.subtitle")
          : t("lnsDeprecation.info.subtitle")}
      </Text>
      <Button
        variant="main"
        size="large"
        onClick={e => {
          e.preventDefault();
          openURL("https://shop.ledger.com/pages/ledger-nano-s-upgrade-program");
        }}
      >
        {t("lnsDeprecation.update")}
      </Button>
      {isPast ? (
        canClearSign ? (
          <Button
            size="large"
            variant="shade"
            // onClick={refresh}
          >
            {t("lnsDeprecation.warning.continue")}
          </Button>
        ) : null
      ) : (
        <Button
          size="large"
          variant="shade"
          // onClick={refresh}
        >
          {t("lnsDeprecation.continue")}
        </Button>
      )}
      <Link
        href="https://support.ledger.com/article/Ledger-Nano-S-Limitations"
        color="palette.text.shade60"
        onClick={e => {
          e.preventDefault();
          openURL("https://support.ledger.com/article/Ledger-Nano-S-Limitations");
        }}
      >
        {t("lnsDeprecation.learnMore")}
      </Link>
      {isPast ? null : (
        <SmallCheckboxWrapper>
          <Checkbox
            key={`checkbox-${isChecked}`}
            isChecked={isChecked}
            onChange={handleChange}
            name="Reminder"
            label={t("lnsDeprecation.info.reminder")}
          />
        </SmallCheckboxWrapper>
      )}
    </Box>
  );
};

export default StepWarningDepecration;

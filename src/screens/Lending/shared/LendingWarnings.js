// @flow
import React, { useState, useCallback, useEffect } from "react";
import { Trans } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import Circle from "../../../components/Circle";
import AmountUp from "../../../icons/AmountUp";
import colors, { rgba } from "../../../colors";
import { isAcceptedLendingTerms } from "../../../logic/terms";
import { NavigatorName, ScreenName } from "../../../const";
import ConfirmationModal from "../../../components/ConfirmationModal";

let HAS_BEEN_SHOWN = false;

export default function HighFeeWarningModal() {
  const [isOpened, setIsOpened] = useState(false);

  const navigation = useNavigation();
  useEffect(() => {
    isAcceptedLendingTerms().then(hasAccepted =>
      !hasAccepted
        ? navigation.navigate(NavigatorName.LendingInfo, {
            screen: ScreenName.LendingTerms,
            params: { endCallback: () => setIsOpened(true) },
          })
        : setIsOpened(!HAS_BEEN_SHOWN),
    );
  }, [navigation]);

  const onClose = useCallback(() => {
    setIsOpened(false);
    HAS_BEEN_SHOWN = true;
  }, []);

  return !HAS_BEEN_SHOWN ? (
    <ConfirmationModal
      isOpened={isOpened}
      onClose={onClose}
      onConfirm={onClose}
      confirmationTitle={<Trans i18nKey="transfer.lending.highFees.title" />}
      confirmationDesc={
        <Trans i18nKey="transfer.lending.highFees.description" />
      }
      Icon={() => (
        <Circle size={56} bg={rgba(colors.orange, 0.2)}>
          <AmountUp size={24} color={colors.orange} />
        </Circle>
      )}
      hideRejectButton
    />
  ) : null;
}

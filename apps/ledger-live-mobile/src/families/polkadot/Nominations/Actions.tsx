/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState, useCallback } from "react";
import { TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import LText from "../../../components/LText";
import InfoModal from "../../../modals/Info";
import Link from "../../../components/wrappedUi/Link";

type Props = {
  electionOpen?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export function NominateAction({ onPress, electionOpen, disabled }: Props) {
  const { t } = useTranslation();

  const [disabledModalOpen, setDisabledModalOpen] = useState(false);

  const onClick = useCallback(() => {
    if (disabled) setDisabledModalOpen(true);
    else onPress();
  }, [onPress, disabled]);

  const onCloseModal = useCallback(() => setDisabledModalOpen(false), []);

  return (
    <>
      <Link type="color" onPress={onClick}>
        {t("polkadot.nomination.nominate")}
      </Link>
      <InfoModal
        isOpened={!!disabledModalOpen}
        onClose={onCloseModal}
        data={[
          electionOpen
            ? {
                title: t("polkadot.info.electionOpen.title"),
                description: t("polkadot.info.electionOpen.description"),
              }
            : {
                title: t("polkadot.info.nominateDisabled.title"),
                description: t("polkadot.info.nominateDisabled.description"),
              },
        ]}
      />
    </>
  );
}

export function SetControllerAction({ onPress }: Props) {
  const { t } = useTranslation();

  return (
    <TouchableOpacity onPress={onPress}>
      <LText semiBold color={"live"}>
        {t("polkadot.nomination.setController")}
      </LText>
    </TouchableOpacity>
  );
}

export function RebondAction({ onPress, disabled }: Props) {
  const { t } = useTranslation();

  const [disabledModalOpen, setDisabledModalOpen] = useState(false);

  const onClick = useCallback(() => {
    if (disabled) setDisabledModalOpen(true);
    else onPress();
  }, [onPress, disabled]);

  const onCloseModal = useCallback(() => setDisabledModalOpen(false), []);

  return (
    <TouchableOpacity onPress={onClick}>
      <LText semiBold color={disabled ? "grey" : "live"}>
        {t("polkadot.unlockings.rebond")}
      </LText>
      <InfoModal
        isOpened={!!disabledModalOpen}
        onClose={onCloseModal}
        data={[
          {
            title: t("polkadot.info.electionOpen.title"),
            description: t("polkadot.info.electionOpen.description"),
          },
        ]}
      />
    </TouchableOpacity>
  );
}

export function WithdrawAction({ onPress, disabled }: Props) {
  const { t } = useTranslation();

  const [disabledModalOpen, setDisabledModalOpen] = useState(false);

  const onClick = useCallback(() => {
    if (disabled) setDisabledModalOpen(true);
    else onPress();
  }, [onPress, disabled]);

  const onCloseModal = useCallback(() => setDisabledModalOpen(false), []);

  return (
    <TouchableOpacity onPress={onClick}>
      <LText semiBold color={disabled ? "grey" : "live"}>
        {t("polkadot.unlockings.withdrawUnbonded")}
      </LText>
      <InfoModal
        isOpened={!!disabledModalOpen}
        onClose={onCloseModal}
        data={[
          {
            title: t("polkadot.info.electionOpen.title"),
            description: t("polkadot.info.electionOpen.description"),
          },
        ]}
      />
    </TouchableOpacity>
  );
}

import React, { useState, useCallback } from "react";
import { TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";

import LText from "~/components/LText";
import InfoModal from "~/modals/Info";

import type { RightPropsType } from "./types";

/*
 * Handle the component declaration.
 */

const Right = (props: RightPropsType) => {
  const [open, setOpen] = useState(false);

  const { t } = useTranslation();
  const { onPress, disabled } = props;

  /*
   * Open and close the modal, conditionally, if there aren't enough funds to delegate.
   */

  const onClose = useCallback(() => setOpen(false), []);
  const onClick = useCallback(() => (disabled ? setOpen(true) : onPress()), [onPress, disabled]);

  /*
   * Return the rendered component.
   */

  return (
    <TouchableOpacity onPress={onClick}>
      <LText semiBold={true} color={disabled ? "grey" : "live"}>
        {t("account.delegation.addDelegation")}
      </LText>

      <InfoModal
        isOpened={open}
        onClose={onClose}
        data={[
          {
            title: t("elrond.info.delegationUnavailable.title"),
            description: t("elrond.info.delegationUnavailable.description"),
          },
        ]}
      />
    </TouchableOpacity>
  );
};

export default Right;

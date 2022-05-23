import React, { useState, useCallback } from "react";
import { TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";

import LText from "../../../../../../components/LText";
import InfoModal from "../../../../../../modals/Info";

type Props = {
  disabled?: boolean,
  onPress: () => void,
};

const Right = (props: Props) => {
  const [disabledModalOpen, setDisabledModalOpen] = useState(false);

  const { t } = useTranslation();
  const { onPress, disabled } = props;

  const onClose = useCallback(() => setDisabledModalOpen(false), []);
  const onClick = useCallback(
    () => (disabled ? setDisabledModalOpen(true) : onPress()),
    [onPress, disabled],
  );

  return (
    <TouchableOpacity onPress={onClick}>
      <LText semiBold={true} color={disabled ? "grey" : "live"}>
        {t("account.delegation.addDelegation")}
      </LText>

      <InfoModal
        isOpened={!!disabledModalOpen}
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

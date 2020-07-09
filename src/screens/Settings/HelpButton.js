import React, { useState } from "react";
import { TouchableOpacity, Linking } from "react-native";
import { useTranslation } from "react-i18next";
import IconQuestion from "../../icons/Question";
import colors from "../../colors";
import type { Props as ModalProps } from "../../components/BottomModal";
import BottomModal from "../../components/BottomModal";
import BottomModalChoice from "../../components/BottomModalChoice";
import IconHelp from "../../icons/Help";
import IconDevice2 from "../../icons/Device2";
import IconShield from "../../icons/Shield";
import IconFacebook from "../../icons/Facebook";
import IconTwitter from "../../icons/Twitter";
import IconGithub from "../../icons/Github";

function CreateModal({ isOpened, onClose }: ModalProps) {
  const { t } = useTranslation();

  return (
    <BottomModal id="HelpModal" isOpened={isOpened} onClose={onClose}>
      <BottomModalChoice
        event="GettingStarted"
        title={t("help.gettingStarted.title")}
        description={t("help.gettingStarted.desc")}
        onPress={() =>
          Linking.openURL(
            "https://www.ledger.com/academy/?utm_source=ledger_live&utm_medium=self_referral&utm_content=help_mobile",
          )
        }
        Icon={IconDevice2}
      />
      <BottomModalChoice
        event="HelpHelpCenter"
        title={t("help.helpCenter.title")}
        description={t("help.helpCenter.desc")}
        onPress={() =>
          Linking.openURL(
            "https://www.ledger.com/start?utm_source=ledger_live&utm_medium=self_referral&utm_content=help_mobile",
          )
        }
        Icon={IconHelp}
      />
      <BottomModalChoice
        event="HelpLedgerAcademy"
        title={t("help.ledgerAcademy.title")}
        description={t("help.ledgerAcademy.desc")}
        onPress={() =>
          Linking.openURL(
            "https://support.ledger.com/hc/en-us?utm_source=ledger_live&utm_medium=self_referral&utm_content=help_mobile",
          )
        }
        Icon={IconShield}
      />
      <BottomModalChoice
        event="HelpFacebook"
        title={t("help.facebook.title")}
        description={t("help.facebook.desc")}
        onPress={() => Linking.openURL("https://facebook.com/Ledger")}
        Icon={IconFacebook}
      />
      <BottomModalChoice
        event="HelpTwitter"
        title={t("help.twitter.title")}
        description={t("help.twitter.desc")}
        onPress={() => Linking.openURL("https://twitter.com/Ledger")}
        Icon={IconTwitter}
      />
      <BottomModalChoice
        event="HelpGithub"
        title={t("help.github.title")}
        description={t("help.github.desc")}
        onPress={() => Linking.openURL("https://github.com/LedgerHQ")}
        Icon={IconGithub}
      />
    </BottomModal>
  );
}

const HelpButton = () => {
  const [isOpen, setOpen] = useState(false);
  return (
    <>
      <TouchableOpacity
        style={{ marginRight: 16 }}
        onPress={() => setOpen(true)}
      >
        <IconQuestion size={18} color={colors.grey} />
      </TouchableOpacity>
      <CreateModal isOpened={isOpen} onClose={() => setOpen(false)} />
    </>
  );
};

export default HelpButton;

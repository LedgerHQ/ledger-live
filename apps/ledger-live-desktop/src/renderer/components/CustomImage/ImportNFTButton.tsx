import React from "react";
import { Icons } from "@ledgerhq/react-ui";
import ImportButton from "./ImportButton";
import { useTranslation } from "react-i18next";

type Props = {
  onClick: () => void;
};

const ImportNFTButton: React.FC<Props> = ({ onClick }) => {
  const { t } = useTranslation();

  return (
    <ImportButton
      text={t("customImage.steps.choose.chooseNft")}
      Icon={Icons.TicketMedium}
      testId="custom-image-import-nft-button"
      onClick={onClick}
    />
  );
};

export default ImportNFTButton;

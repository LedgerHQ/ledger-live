import React, { useCallback } from "react";
import { Icons } from "@ledgerhq/react-ui";
import {
  ImageIncorrectFileTypeError,
  ImageLoadFromFileError,
} from "@ledgerhq/live-common/customImage/errors";
import { ImageBase64Data } from "./types";
import styled from "styled-components";
import ImportButton from "./ImportButton";
import { useTranslation } from "react-i18next";

type Props = {
  onResult?: (res: ImageBase64Data) => void;
  onError?: (error: Error) => void;
  setLoading?: (_: boolean) => void;
};

const ImportNFT: React.FC<Props> = ({ setLoading, onResult, onError }) => {
  const { t } = useTranslation();

  return (
    <ImportButton
      text={t("customImage.steps.choose.chooseNft")}
      Icon={Icons.TicketMedium}
      data-test-id="custom-image-import-nft-button"
    />
  );
};

export default ImportNFT;

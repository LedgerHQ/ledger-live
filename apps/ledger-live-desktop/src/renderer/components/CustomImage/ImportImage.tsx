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
  onResult: (res: ImageBase64Data) => void;
  onError: (error: Error) => void;
  setLoading: (_: boolean) => void;
};

const ImageInput = styled.input.attrs({
  type: "file",
  accept: "image/*",
  title: "",
  value: "",
})`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
`;

const ImportImage: React.FC<Props> = ({ setLoading, onResult, onError }) => {
  const { t } = useTranslation();
  const handleFile = useCallback(
    (file: File) => {
      let dead = false;
      try {
        const reader = new FileReader();
        if (!file) return;
        if (!file.type.startsWith("image/")) {
          onError(new ImageIncorrectFileTypeError());
          return;
        }

        setLoading(true);
        reader.onloadend = function() {
          if (!dead && typeof reader.result === "string")
            onResult({ imageBase64DataUri: reader.result });
        };
        reader.readAsDataURL(file);
      } catch (e) {
        onError(new ImageLoadFromFileError());
      }
      return () => {
        dead = true;
      };
    },
    [onResult, setLoading, onError],
  );

  const onChange: React.ChangeEventHandler<HTMLInputElement> = useCallback(
    e => {
      const { files } = e.target;
      if (!files) return;
      const file = files[0];
      if (!file) return;
      handleFile(file);
    },
    [handleFile],
  );
  return (
    <ImportButton
      text={t("customImage.steps.choose.upload")}
      Icon={Icons.UploadMedium}
      data-test-id="custom-image-import-image-button"
    >
      <ImageInput onChange={onChange} data-test-id="custom-image-import-image-input" />
    </ImportButton>
  );
};

export default ImportImage;

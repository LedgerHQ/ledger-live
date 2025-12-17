import React, { useCallback } from "react";
import { Button, Icons } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import {
  ImageIncorrectFileTypeError,
  ImageLoadFromFileError,
} from "@ledgerhq/live-common/customImage/errors";
import { ImageBase64Data } from "./types";

type Props = {
  onResult: (res: ImageBase64Data) => void;
  onError: (error: Error) => void;
  setLoading: (_: boolean) => void;
  onClick: () => void;
};

const acceptedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/bmp",
  "image/tiff",
  "image/heif",
  "image/heic",
];
const acceptedMimeTypesString = acceptedMimeTypes.join(", ");

const ImageInput = styled.input.attrs({
  type: "file",
  accept: acceptedMimeTypesString,
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

const ImportImage: React.FC<Props> = ({ setLoading, onResult, onError, onClick }) => {
  const { t } = useTranslation();
  const handleFile = useCallback(
    (file: File) => {
      let dead = false;
      try {
        const reader = new FileReader();
        if (!file) return;
        if (!acceptedMimeTypes.includes(file.type)) {
          onError(new ImageIncorrectFileTypeError());
          return;
        }

        setLoading(true);
        reader.onloadend = function () {
          if (!dead && typeof reader.result === "string")
            onResult({ imageBase64DataUri: reader.result });
        };
        reader.readAsDataURL(file);
      } catch {
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
    <Button
      variant="main"
      size="medium"
      iconPosition="left"
      width="fit-content"
      alignSelf="center"
      Icon={<Icons.UploadCenterArrow size="S" />}
      data-testid="custom-image-import-image-button"
      onClick={onClick}
    >
      {t("customImage.steps.choose.upload")}
      <ImageInput onChange={onChange} data-testid="custom-image-import-image-input" />
    </Button>
  );
};

export default ImportImage;

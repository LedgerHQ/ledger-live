import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ImageBase64Data } from "~/renderer/components/CustomImage/types";
import ImportImage from "~/renderer/components/CustomImage/ImportImage";
import { StepProps } from "./types";
import StepContainer from "./StepContainer";
import { Flex, IconsLegacy, InfiniteLoader, Link, Text } from "@ledgerhq/react-ui";
import TrackPage from "~/renderer/analytics/TrackPage";
import { analyticsPageNames, analyticsFlowName } from "./shared";
import { useTrack } from "~/renderer/analytics/segment";
import STAX_CLS_PREVIEW from "~/renderer/animations/customLockScreen/stax.json";
import FLEX_CLS_PREVIEW from "~/renderer/animations/customLockScreen/flex.json";
import APEX_CLS_PREVIEW from "~/renderer/animations/customLockScreen/apex.json";
import Animation from "~/renderer/animations";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { getDeviceModel } from "@ledgerhq/devices";

type Props = StepProps & {
  deviceModelId: DeviceModelId | null;
  onResult: (res: ImageBase64Data) => void;
  setLoading: (_: boolean) => void;
  loading?: boolean;
  hasCustomLockScreen?: boolean;
  onClickRemoveCustomImage: () => void;
};

const StepChooseImage: React.FC<Props> = props => {
  const {
    deviceModelId,
    loading,
    setLoading,
    onResult,
    onError,
    hasCustomLockScreen,
    onClickRemoveCustomImage,
  } = props;
  const { t } = useTranslation();
  const track = useTrack();

  const animationSource = useMemo(() => {
    switch (deviceModelId) {
      case DeviceModelId.stax:
        return STAX_CLS_PREVIEW;
      case DeviceModelId.europa:
        return FLEX_CLS_PREVIEW;
      case DeviceModelId.apex:
        return APEX_CLS_PREVIEW;
    }
  }, [deviceModelId]);

  const productName: string = useMemo(() => {
    if (!deviceModelId) return "";
    return getDeviceModel(deviceModelId)?.productName;
  }, [deviceModelId]);

  return (
    <StepContainer>
      <TrackPage
        category={analyticsPageNames.chooseImage}
        type="drawer"
        flow={analyticsFlowName}
        refreshSource={false}
      />
      {loading ? (
        <Flex flex={1} justifyContent="center" alignItems="center">
          <InfiniteLoader />
        </Flex>
      ) : (
        <Flex flexDirection="column">
          <Flex py={"15px"} data-testid="custom-image-step-1-choose-image">
            <Animation animation={animationSource} height="fit-content" />
          </Flex>
          <Text
            variant="h5Inter"
            fontWeight="semiBold"
            textAlign="center"
            textTransform="none"
            whiteSpace="pre"
            lineHeight="normal"
            marginY="32px"
          >
            {t("customImage.steps.choose.description", {
              productName,
            })}
          </Text>
          <ImportImage
            setLoading={setLoading}
            onResult={onResult}
            onError={onError}
            onClick={() =>
              track("button_clicked2", {
                button: "Choose from my picture gallery",
              })
            }
          />
          {hasCustomLockScreen ? (
            <Link
              size="medium"
              color="error.c60"
              mt={10}
              onClick={onClickRemoveCustomImage}
              Icon={IconsLegacy.TrashMedium}
            >
              {t("removeCurrentPicture.cta")}
            </Link>
          ) : null}
        </Flex>
      )}
    </StepContainer>
  );
};

export default StepChooseImage;

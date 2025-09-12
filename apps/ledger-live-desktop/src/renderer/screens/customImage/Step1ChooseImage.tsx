import React from "react";
import { useTranslation } from "react-i18next";
import { ImageBase64Data } from "~/renderer/components/CustomImage/types";
import ImportImage from "~/renderer/components/CustomImage/ImportImage";
import { StepProps } from "./types";
import StepContainer from "./StepContainer";
import { Flex, IconsLegacy, InfiniteLoader, Link } from "@ledgerhq/react-ui";

import TrackPage from "~/renderer/analytics/TrackPage";
import { analyticsPageNames, analyticsFlowName } from "./shared";
import { useTrack } from "~/renderer/analytics/segment";

type Props = StepProps & {
  onResult: (res: ImageBase64Data) => void;
  setLoading: (_: boolean) => void;
  loading?: boolean;
  hasCustomLockScreen?: boolean;
  onClickRemoveCustomImage: () => void;
};

const StepChooseImage: React.FC<Props> = props => {
  const { loading, setLoading, onResult, onError, hasCustomLockScreen, onClickRemoveCustomImage } =
    props;
  const { t } = useTranslation();
  const track = useTrack();

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
        <Flex flexDirection="column" rowGap={6} px={12}>
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

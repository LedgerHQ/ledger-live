import React, { useCallback, useMemo, useState } from "react";
import { BoxedIcon, Flex, Icons, Text } from "@ledgerhq/react-ui";
import { useDispatch } from "react-redux";
import DeviceAction from "~/renderer/components/DeviceAction";
import { createAction } from "@ledgerhq/live-common/hw/actions/staxRemoveImage";
import removeImage from "@ledgerhq/live-common/hw/staxRemoveImage";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { clearLastSeenCustomImage } from "~/renderer/actions/settings";

const action = createAction(removeImage);

const TextEllipsis = styled.div`
  flex-shrink: 1;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const RemoveCustomImage: React.FC<{}> = () => {
  const request = useMemo(() => ({}), []);
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const [completed, setCompleted] = useState(false);
  const [running, setRunning] = useState(true);

  const onSuccess = useCallback(() => {
    setCompleted(true);
    setRunning(false);
    dispatch(clearLastSeenCustomImage());
  }, [dispatch]);

  return (
    <Flex
      flexDirection="column"
      rowGap={5}
      height="100%"
      overflowY="hidden"
      width="100%"
      flex={1}
      data-test-id="device-rename-container"
    >
      <Flex flex={1} flexDirection="column" justifyContent="space-between" overflowY="hidden">
        {completed ? (
          <Flex
            flex={1}
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            data-test-id="custom-image-removed"
          >
            <BoxedIcon
              Icon={Icons.CheckAloneMedium}
              iconColor="success.c100"
              size={64}
              iconSize={24}
            />
            <Text
              variant="large"
              alignSelf="stretch"
              mx={16}
              mt={10}
              textAlign="center"
              fontSize={22}
            >
              <TextEllipsis>{t("removeCustomLockscreen.success")}</TextEllipsis>
            </Text>
          </Flex>
        ) : running ? (
          <Flex flex={1} alignItems="center" justifyContent="center" p={2}>
            <DeviceAction request={request} action={action} onResult={onSuccess} />
          </Flex>
        ) : null}
      </Flex>
    </Flex>
  );
};

export default withV3StyleProvider(RemoveCustomImage);

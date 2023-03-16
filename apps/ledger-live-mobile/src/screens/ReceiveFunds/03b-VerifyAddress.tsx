import React, { useCallback, useEffect, useRef, useState } from "react";
import { of, Subscription } from "rxjs";
import { delay } from "rxjs/operators";
import { TouchableOpacity, Linking } from "react-native";
import { useSelector } from "react-redux";
import { useTranslation, Trans } from "react-i18next";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import {
  getMainAccount,
  getAccountCurrency,
} from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import styled, { useTheme } from "styled-components/native";
import { Flex } from "@ledgerhq/native-ui";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import { track, TrackScreen } from "../../analytics";
import { accountScreenSelector } from "../../reducers/accounts";
import PreventNativeBack from "../../components/PreventNativeBack";
import SkipLock from "../../components/behaviour/SkipLock";
import logger from "../../logger";
import { rejectionOp } from "../../logic/debugReject";
import { ScreenName } from "../../const";
import LText from "../../components/LText";
import Button from "../../components/Button";
import Animation from "../../components/Animation";
import { getDeviceAnimation } from "../../helpers/getDeviceAnimation";
import Illustration from "../../images/illustration/Illustration";
import { urls } from "../../config/urls";
import { ReceiveFundsStackParamList } from "../../components/RootNavigator/types/ReceiveFundsNavigator";
import { StackNavigatorProps } from "../../components/RootNavigator/types/helpers";

const illustrations = {
  dark: require("../../images/illustration/Dark/_080.png"),
  light: require("../../images/illustration/Light/_080.png"),
};

type Props = {
  account?: TokenAccount | Account;
  parentAccount?: Account;
  readOnlyModeEnabled?: boolean;
} & StackNavigatorProps<
  ReceiveFundsStackParamList,
  ScreenName.ReceiveVerifyAddress
>;

const AnimationContainer = styled(Flex).attrs({
  alignSelf: "stretch",
  alignItems: "center",
  justifyContent: "center",
  height: "auto",
  mt: 8,
})``;

export default function ReceiveVerifyAddress({ navigation, route }: Props) {
  const { theme: themeKind } = useTheme();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  const { t } = useTranslation();
  const [error, setError] = useState<Error | null>(null);

  const onModalClose = useCallback(() => {
    setError(null);
  }, []);

  const sub = useRef<Subscription>();

  const { onSuccess, onError, device } = route.params;

  const verifyOnDevice = useCallback(
    async (device: Device): Promise<void> => {
      if (!account) return;
      const mainAccount = getMainAccount(account, parentAccount);

      sub.current = (
        mainAccount.id.startsWith("mock")
          ? of({}).pipe(delay(1000), rejectionOp())
          : getAccountBridge(mainAccount).receive(mainAccount, {
              deviceId: device.deviceId,
              verify: true,
            })
      ).subscribe({
        complete: () => {
          if (onSuccess) onSuccess(mainAccount.freshAddress);
          else
            navigation.navigate(ScreenName.ReceiveVerificationConfirmation, {
              ...route.params,
              verified: true,
              createTokenAccount: false,
            });
        },
        error: (error: Error) => {
          if (error && error.name !== "UserRefusedAddress") {
            logger.critical(error);
          }
          setError(error);
          if (onError) onError();
        },
      });
    },
    [account, navigation, onError, onSuccess, parentAccount, route.params],
  );

  const mainAccount = account && getMainAccount(account, parentAccount);
  const currency =
    route.params?.currency || (account && getAccountCurrency(account));

  const onRetry = useCallback(() => {
    track("button_clicked", {
      button: "Retry",
    });
    onModalClose();
    if (device) {
      verifyOnDevice(device);
    }
  }, [device, onModalClose, verifyOnDevice]);

  const goBack = useCallback(() => {
    track("button_clicked", {
      button: "Cancel",
    });
    navigation.navigate(ScreenName.ReceiveConfirmation, {
      ...route.params,
      verified: false,
    });
  }, [navigation, route.params]);

  const redirectToSupport = useCallback(() => {
    track("message_clicked", {
      message: "contact us asap",
      url: urls.receiveVerifyAddress,
    });
    Linking.openURL(urls.receiveVerifyAddress);
  }, []);

  useEffect(() => {
    if (device) {
      verifyOnDevice(device);
    }
  }, [device, verifyOnDevice]);

  if (!account || !currency || !mainAccount || !device) return null;

  return (
    <>
      <PreventNativeBack />
      <SkipLock />
      <SyncSkipUnderPriority priority={100} />
      {error ? (
        <>
          <TrackScreen category="Receive" name="Address Verification Denied" />
          <Flex flex={1} alignItems="center" justifyContent="center" p={6}>
            <Illustration
              lightSource={illustrations.light}
              darkSource={illustrations.dark}
              size={240}
            />
            <LText variant="h4" bold textAlign="center" mb={6}>
              {t("transfer.receive.verifyAddress.cancel.title")}
            </LText>
            <LText variant="body" color="neutral.c70" textAlign="center" mb={6}>
              {t("transfer.receive.verifyAddress.cancel.subtitle")}
            </LText>

            <TouchableOpacity onPress={redirectToSupport}>
              <LText variant="body" color="neutral.c70" textAlign="center">
                <Trans i18nKey="transfer.receive.verifyAddress.cancel.info">
                  <LText
                    color="primary.c80"
                    style={{ textDecorationLine: "underline" }}
                  />
                </Trans>
              </LText>
            </TouchableOpacity>
          </Flex>
          <Flex
            p={6}
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Button flex={1} type="secondary" outline onPress={goBack}>
              {t("common.cancel")}
            </Button>
            <Button
              flex={1}
              type="main"
              ml={6}
              outline={false}
              onPress={onRetry}
            >
              {t("common.retry")}
            </Button>
          </Flex>
        </>
      ) : (
        <Flex flex={1} alignItems="center" justifyContent="center" p={6}>
          <TrackScreen category="ReceiveFunds" name="Verify Address" />
          <LText variant="h4" textAlign="center" mb={6}>
            {t("transfer.receive.verifyAddress.title")}
          </LText>
          <LText variant="body" color="neutral.c70" textAlign="center">
            {t("transfer.receive.verifyAddress.subtitle")}
          </LText>
          <Flex mt={10} bg={"neutral.c30"} borderRadius={8} p={6} mx={6}>
            <LText semiBold textAlign="center">
              {mainAccount.freshAddress}
            </LText>
          </Flex>
          <AnimationContainer>
            <Animation
              style={{ width: "100%" }}
              source={getDeviceAnimation({
                device,
                key: "verify",
                theme: themeKind,
              })}
            />
          </AnimationContainer>
        </Flex>
      )}
    </>
  );
}

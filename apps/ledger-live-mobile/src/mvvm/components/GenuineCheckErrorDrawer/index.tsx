import { track } from "@shared/analytics";
import { TrackScreen } from "@shared/analytics-react";
import React, { useCallback } from "react";
import { Button, Flex, Icons, Link } from "@ledgerhq/native-ui";
import { useTranslation } from "~/context/Locale";
import QueuedDrawer from "~/components/QueuedDrawer";
import GenericErrorView from "~/components/GenericErrorView";
import { GenericInformationBody } from "~/components/GenericInformationBody";
import { useNavigation } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";
import { DmkError, isDmkError } from "@ledgerhq/live-dmk-mobile";

type ExperimentalSettingsNavigation = {
  navigate: (
    navigator: typeof NavigatorName.Base,
    params: {
      screen: typeof NavigatorName.Settings;
      params: { screen: typeof ScreenName.ExperimentalSettings };
    },
  ) => void;
};

export type Props = {
  isOpen: boolean;
  onRetry: () => void;
  onCancel: () => void;
  onClose?: () => void;
  productName: string;
  error: Error | DmkError | null;
  showProviderSettings?: boolean;
};

const GenuineCheckErrorDrawer: React.FC<Props> = ({
  isOpen,
  onRetry,
  onCancel,
  onClose,
  productName,
  error,
  showProviderSettings = false,
}) => {
  const { t } = useTranslation();
  const navigation = useNavigation<ExperimentalSettingsNavigation>();
  const eName = (error as { name?: string })?.name;

  const isNotFoundEntity =
    showProviderSettings ||
    Boolean(
      error &&
      (eName === "FirmwareNotRecognized" ||
        (error instanceof Error && error.message === "not found entity")),
    );

  const onGoToSettings = useCallback(() => {
    track("button_clicked", {
      button: "Go to settings",
      page: "Error: Ledger Stax OS version not recognized",
    });
    navigation.navigate(NavigatorName.Base, {
      screen: NavigatorName.Settings,
      params: {
        screen: ScreenName.ExperimentalSettings,
      },
    });
  }, [navigation]);

  let content;

  let screenName = "Error: unknown error";
  if (isNotFoundEntity) {
    screenName = "Error: Device OS version not recognized";
  } else if (error) {
    const errorLabel = isDmkError(error) ? error._tag : eName;
    screenName = `Error: ${errorLabel}`;
  }

  const handleRetry = () => {
    track("button_clicked", {
      button: "Try again",
      page: screenName,
    });
    onRetry();
  };

  const handleCancel = () => {
    track("button_clicked", {
      button: "Cancel",
      page: screenName,
    });
    onCancel();
  };

  if (isNotFoundEntity) {
    content = (
      <>
        <Flex justifyContent="center" alignItems="center" mt={10}>
          <GenericInformationBody
            title={t("earlySecurityCheck.genuineCheckErrorDrawer.notFoundEntity.title")}
            description={t(
              "earlySecurityCheck.genuineCheckErrorDrawer.notFoundEntity.description",
              {
                productName,
              },
            )}
          />
        </Flex>
        <Button type="main" mt={8} mb={7} size={"large"} onPress={onGoToSettings}>
          {t("earlySecurityCheck.genuineCheckErrorDrawer.notFoundEntity.settingsCta")}
        </Button>
        <Link onPress={handleCancel} size={"large"}>
          {t("earlySecurityCheck.genuineCheckErrorDrawer.cancelCta")}
        </Link>
      </>
    );
  } else if (error) {
    content = (
      <Flex mt={7}>
        <GenericErrorView
          error={error}
          Icon={Icons.WarningFill}
          iconColor="warning.c70"
          hasExportLogButton={false}
        />
        <Button
          type="main"
          mt={eName === "BluetoothRequired" ? 6 : 8}
          mb={7}
          size={"large"}
          onPress={handleRetry}
        >
          {t("earlySecurityCheck.genuineCheckErrorDrawer.retryCta")}
        </Button>
        <Link onPress={handleCancel} size="large">
          {t("earlySecurityCheck.genuineCheckErrorDrawer.cancelCta")}
        </Link>
      </Flex>
    );
  } else {
    content = (
      <>
        <Flex justifyContent="center" alignItems="center" mt={10}>
          <GenericInformationBody
            title={t("earlySecurityCheck.genuineCheckErrorDrawer.title")}
            description={t("earlySecurityCheck.genuineCheckErrorDrawer.description", {
              productName,
            })}
            Icon={Icons.WarningFill}
            iconColor={"warning.c70"}
          />
        </Flex>
        <Button type="main" mt={8} mb={7} size={"large"} onPress={handleRetry}>
          {t("earlySecurityCheck.genuineCheckErrorDrawer.retryCta")}
        </Button>
        <Link onPress={handleCancel} size="large">
          {t("earlySecurityCheck.genuineCheckErrorDrawer.cancelCta")}
        </Link>
      </>
    );
  }

  return (
    <QueuedDrawer
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
      preventBackdropClick
      noCloseButton
    >
      <TrackScreen name={screenName} type="drawer" refreshSource={false} />
      {content}
    </QueuedDrawer>
  );
};

export default GenuineCheckErrorDrawer;

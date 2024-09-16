import { useNavigation } from "@react-navigation/native";
import React from "react";
import QueuedDrawer from "LLM/components/QueuedDrawer";
import { TrackScreen } from "~/analytics";
import {
  RootNavigationComposite,
  StackNavigatorNavigation,
} from "~/components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { NavigatorName, ScreenName } from "~/const";
import FollowInstructions from "../../components/FollowInstructions";

import GenericErrorView from "~/components/GenericErrorView";
import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";
import { ConfirmManageKey } from "../../components/ManageKey/Confirm";
import { DeletionError } from "../../components/ManageInstances/DeletionError";
import { DrawerProps, SceneKind } from "../../hooks/useFollowInstructionDrawer";
import { SpecificError } from "../../components/Error/SpecificError";
import { ErrorReason } from "../../hooks/useSpecificError";

type Props = DrawerProps & {
  isOpen: boolean;
  handleClose: () => void;
};

const GenericFollowInstructionsDrawer = ({
  isOpen,
  handleClose,
  scene,
  goToDelete,
  backToWrongSeedError,
  confirmDeleteKey,
  retry,
}: Props) => {
  const { navigate } =
    useNavigation<RootNavigationComposite<StackNavigatorNavigation<BaseNavigatorStackParamList>>>();

  const getScene = () => {
    switch (scene.kind) {
      case SceneKind.DeviceInstructions:
        return <FollowInstructions device={scene.device} />;

      case SceneKind.Loader:
        return (
          <Flex alignItems="center" justifyContent="center" height={150}>
            <InfiniteLoader size={50} />
          </Flex>
        );

      case SceneKind.ConfirmDeleteWrongSeedError:
        return (
          <ConfirmManageKey onClickConfirm={confirmDeleteKey} onCancel={backToWrongSeedError} />
        );

      case SceneKind.KeyError:
        return (
          <DeletionError
            error={ErrorReason.UNSECURED}
            primaryAction={handleClose}
            secondaryAction={goToDelete}
          />
        );

      case SceneKind.AlreadySecuredSameSeed:
        return <SpecificError error={ErrorReason.SAME_SEED} primaryAction={handleClose} />;

      case SceneKind.AlreadySecuredOtherSeed:
        return (
          <SpecificError
            error={ErrorReason.OTHER_SEED}
            secondaryAction={handleClose}
            primaryAction={goToDelete}
          />
        );

      case SceneKind.GenericError:
        return <GenericErrorView error={scene.error} withDescription withHelp hasExportLogButton />;

      case SceneKind.UnbackedError:
        return (
          <SpecificError
            error={ErrorReason.NO_BACKUP_ONBOARDING_DEVICE}
            primaryAction={retry}
            secondaryAction={() => {
              navigate(NavigatorName.BaseOnboarding, {
                screen: NavigatorName.Onboarding,
                params: {
                  screen: ScreenName.OnboardingPostWelcomeSelection,
                  params: { userHasDevice: true },
                },
              });
            }}
          />
        );
    }
  };

  return (
    <>
      <TrackScreen />
      <QueuedDrawer isRequestingToBeOpened={isOpen} onClose={handleClose}>
        {getScene()}
      </QueuedDrawer>
    </>
  );
};

export default GenericFollowInstructionsDrawer;

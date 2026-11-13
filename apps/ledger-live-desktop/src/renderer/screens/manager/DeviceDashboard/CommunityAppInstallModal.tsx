import React, { memo, useCallback } from "react";
import { Trans } from "react-i18next";
import { App } from "@ledgerhq/types-live";
import { Action } from "@ledgerhq/live-common/apps/types";
import ConfirmModal from "~/renderer/modals/ConfirmModal/index";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";

type Props = {
  /** Community app the user asked to install; the modal is closed when undefined. */
  app?: App;
  dispatch: (a: Action) => void;
  onClose: () => void;
};

/** Legal disclaimer shown before installing a community app. Closing it cancels the install. */
const CommunityAppInstallModal = ({ app, dispatch, onClose }: Props) => {
  const onConfirm = useCallback(() => {
    if (app) dispatch({ type: "install", name: app.name });
    onClose();
  }, [app, dispatch, onClose]);

  if (!app) return null;

  return (
    <ConfirmModal
      analyticsName="ManagerConfirmationCommunityApp"
      isOpened
      onReject={onClose}
      onClose={onClose}
      onConfirm={onConfirm}
      title={<Trans i18nKey="manager.apps.communityInstall.title" />}
      desc={
        <Box flow={3} data-testid="manager-community-install-disclaimer">
          <Text ff="Inter|Regular" fontSize={4} color="neutral.c70">
            <Trans i18nKey="manager.applist.communityDisclaimer.availability" />
          </Text>
          <Text ff="Inter|Regular" fontSize={4} color="neutral.c70">
            <Trans i18nKey="manager.applist.communityDisclaimer.liability" />
          </Text>
        </Box>
      }
      confirmText={<Trans i18nKey="manager.apps.communityInstall.confirm" />}
      cancelText={<Trans i18nKey="common.cancel" />}
    />
  );
};

export default memo<Props>(CommunityAppInstallModal);

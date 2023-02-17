import React from "react";
import { AppRequest, AppState } from "@ledgerhq/live-common/hw/actions/app";
import { Popin } from "@ledgerhq/react-ui";
import styled from "styled-components";

import { DeviceActionDefaultRendering } from "../DeviceAction";

const AppInstallPopin = styled(Popin)`
  max-height: unset !important;
  height: unset !important;
`;

type Props = {
  isOpen: boolean;
  status: AppState;
  request: AppRequest;
};

const AllowManagerModal = ({ isOpen, status, request }: Props) => {
  return (
    <AppInstallPopin isOpen={isOpen}>
      <DeviceActionDefaultRendering status={status} request={request} />
    </AppInstallPopin>
  );
};

export default AllowManagerModal;

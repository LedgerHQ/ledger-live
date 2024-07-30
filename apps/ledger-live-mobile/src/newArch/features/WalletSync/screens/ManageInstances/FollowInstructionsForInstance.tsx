import React from "react";
import FollowInstructions from "../../components/FollowInstructions";

import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";
import GenericErrorView from "~/components/GenericErrorView";
import { TrustchainMember } from "@ledgerhq/trustchain/types";
import { useRemoveMembers } from "../../hooks/useRemoveMember";

type Props = {
  device: Device | null;
  member: TrustchainMember | null;
  showUnsecured: () => void;
};

const FollowInstructionsForInstance = ({ device, member, showUnsecured }: Props) => {
  const { error, userDeviceInteraction } = useRemoveMembers({ device, member, showUnsecured });

  return (
    <>
      {error ? (
        <GenericErrorView error={error} withDescription withHelp hasExportLogButton />
      ) : userDeviceInteraction && device ? (
        <FollowInstructions device={device} />
      ) : (
        <Flex alignItems="center" justifyContent="center" height={150}>
          <InfiniteLoader size={50} />
        </Flex>
      )}
    </>
  );
};

export default FollowInstructionsForInstance;

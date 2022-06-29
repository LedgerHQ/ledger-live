import React, { useCallback, useEffect, useState } from "react";
import { BoxedIcon, Flex, InfiniteLoader, Text } from "@ledgerhq/native-ui";
import { CheckAloneMedium } from "@ledgerhq/native-ui/assets/icons";
import { FlexBoxProps } from "@ledgerhq/native-ui/components/Layout/Flex";

type CheckStatus = "inactive" | "active" | "completed";

type CheckCardProps = FlexBoxProps & {
  title: string;
  index: number;
  status: CheckStatus;
};

const CheckCard = ({ title, index, status, ...props }: CheckCardProps) => {
  const getCheckIcon = useCallback((status: CheckStatus, index: number) => {
    if (status === "active") {
      return <InfiniteLoader size={24} />;
    }
    if (status === "completed") {
      return <CheckAloneMedium color="success.c100" size={16} />;
    }
    return <Text variant="body">{index}</Text>;
  }, []);

  return (
    <Flex flexDirection="row" alignItems="center" {...props}>
      <BoxedIcon
        backgroundColor="neutral.c30"
        borderColor="neutral.c30"
        variant="circle"
        Icon={getCheckIcon(status, index)}
      />
      <Text ml={4} variant="body">
        {title}
      </Text>
    </Flex>
  );
};

export type Props = {
  onComplete?: () => void;
};

const SoftwareChecksStep = ({ onComplete }: Props) => {
  const [genuineCheckStatus, setGenuineCheckStatus] = useState<CheckStatus>(
    "inactive",
  );
  const [firmwareUpdateStatus, setFirmwareUpdateStatus] = useState<CheckStatus>(
    "inactive",
  );

  const handleGenuineCheck = useCallback(() => {
    // TODO implement genuine check logic
    setTimeout(() => {
      setGenuineCheckStatus("completed");
    }, 3000);
  }, []);

  const handleFirmwareUpdate = useCallback(() => {
    // TODO implement firmware update logic
    setTimeout(() => {
      setFirmwareUpdateStatus("completed");
    }, 3000);
  }, []);

  useEffect(() => {
    if (genuineCheckStatus === "inactive") {
      setGenuineCheckStatus("active");
      handleGenuineCheck();
    }
  }, [genuineCheckStatus, handleGenuineCheck]);

  useEffect(() => {
    if (
      genuineCheckStatus === "completed" &&
      firmwareUpdateStatus === "inactive"
    ) {
      setFirmwareUpdateStatus("active");
      handleFirmwareUpdate();
    }
  }, [genuineCheckStatus, firmwareUpdateStatus, handleFirmwareUpdate]);

  useEffect(() => {
    if (onComplete && firmwareUpdateStatus === "completed") {
      onComplete();
    }
  }, [firmwareUpdateStatus, onComplete]);

  return (
    <Flex>
      <CheckCard
        title="Genuine check"
        status={genuineCheckStatus}
        index={1}
        mb={4}
      />
      <CheckCard
        title="Firmware update"
        status={firmwareUpdateStatus}
        index={2}
      />
    </Flex>
  );
};

export default SoftwareChecksStep;

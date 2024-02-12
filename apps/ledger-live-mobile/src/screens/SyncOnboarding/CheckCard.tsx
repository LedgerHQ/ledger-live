import React from "react";
import { ExternalLinkMedium } from "@ledgerhq/native-ui/assets/icons";
import { Flex, Icons, InfiniteLoader, Text, Link, BoxedIcon } from "@ledgerhq/native-ui";
import { UiCheckStatus } from "./EarlySecurityCheck";

export type CheckCardProps = {
  title: string;
  description?: string | null;
  learnMore?: string | null;
  onLearnMore?: () => void;
  index: number;
  status: UiCheckStatus;
};

const CheckCard: React.FC<CheckCardProps> = ({
  title,
  description,
  learnMore,
  onLearnMore,
  index,
  status,
}) => {
  let checkIcon;
  switch (status) {
    case "active":
      checkIcon = <InfiniteLoader color="primary.c80" size={20} />;
      break;
    case "completed":
      checkIcon = <Icons.CheckmarkCircleFill color="success.c60" size="S" />;
      break;
    case "error":
    case "genuineCheckRefused":
      checkIcon = <Icons.WarningFill color="warning.c70" size="S" />;
      break;
    case "firmwareUpdateRefused":
      checkIcon = <Icons.InformationFill color="primary.c80" size="S" />;
      break;
    case "inactive":
    default:
      checkIcon = <Text variant="body">{index}</Text>;
  }

  return (
    <Flex
      flexDirection="row"
      alignItems={description || (learnMore && onLearnMore) ? "flex-start" : "center"}
    >
      <BoxedIcon
        backgroundColor="opacityDefault.c10"
        borderColor="transparent"
        variant="circle"
        Icon={checkIcon}
      />
      <Flex ml={6} flexDirection="column" flex={1} justifyContent="flex-end">
        <Text variant="largeLineHeight">{title}</Text>
        {description ? (
          <Text mt={1} variant="body" color="neutral.c70">
            {description}
          </Text>
        ) : null}
        {learnMore && onLearnMore ? (
          <Flex mt={3}>
            <Link
              Icon={ExternalLinkMedium}
              onPress={onLearnMore}
              style={{ justifyContent: "flex-start" }}
            >
              {learnMore}
            </Link>
          </Flex>
        ) : null}
      </Flex>
    </Flex>
  );
};

export default CheckCard;

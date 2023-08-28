import React from "react";
import { FlexBoxProps } from "@ledgerhq/native-ui/components/Layout/Flex";
import {
  CheckTickMedium,
  ExternalLinkMedium,
  WarningSolidMedium,
  InfoAltFillMedium,
} from "@ledgerhq/native-ui/assets/icons";
import { Flex, InfiniteLoader, Text, Link, BoxedIcon } from "@ledgerhq/native-ui";
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
      checkIcon = <CheckTickMedium color="success.c50" size={20} />;
      break;
    case "error":
    case "genuineCheckRefused":
      checkIcon = <WarningSolidMedium color="warning.c60" size={20} />;
      break;
    case "firmwareUpdateRefused":
      checkIcon = <InfoAltFillMedium color="primary.c80" size={20} />;
      break;
    case "inactive":
    default:
      checkIcon = <Text variant="body">{index}</Text>;
  }

  return (
    <Flex flexDirection="row" alignItems="flex-start">
      <BoxedIcon
        backgroundColor="opacityDefault.c10"
        borderColor="opacityDefault.c10"
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

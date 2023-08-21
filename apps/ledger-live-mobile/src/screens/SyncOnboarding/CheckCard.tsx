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

export type CheckCardProps = FlexBoxProps & {
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
  ...props
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
    <Flex flexDirection="row" alignItems="flex-start" {...props}>
      <BoxedIcon
        backgroundColor="neutral.c30"
        borderColor="neutral.c30"
        variant="circle"
        Icon={checkIcon}
      />
      <Flex flexDirection="column" flex={1} justifyContent="flex-end">
        <Text ml={4} variant="large">
          {title}
        </Text>
        {description ? (
          <Text ml={4} mt={2} mb={4} variant="body" color="neutral.c70">
            {description}
          </Text>
        ) : null}
        {learnMore && onLearnMore ? (
          <Flex ml={4} mb={4}>
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

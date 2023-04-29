import React from "react";
import ContinueOnDeviceComponent from ".";
import Flex from "../../layout/Flex";

const description = `
### Component to inform the user to continue the current flow by checking their device. An example with more context can be found in the VerticalTimeline component story.

## Usage

\`\`\`js

import { Icons, ContinueOnDevice } from "@ledgerhq/react-ui"

const YourComponent = () => (
  <ContinueOnDevice
    Icon={Icon.StaxMedium}
    text="Perform this action on your Ledger Stax"
    withTopDivider={false} // this will 
  />
)

\`\`\`

## Sandbox
`;

const PlaceholderIcon = ({ size }: { size: number }) => (
  <Flex height={size} width={size} borderRadius={size} bg="neutral.c40" />
);

export default {
  title: "Messages/ContinueOnDevice",
  component: ContinueOnDeviceComponent,
  parameters: {
    docs: {
      description: {
        component: description,
      },
    },
  },
  argTypes: {
    Icon: {
      type: "object",
      defaultValue: PlaceholderIcon,
    },
    text: {
      type: "string",
      defaultValue: "Continue on device",
    },
    withTopDivider: {
      type: "boolean",
      defaultValue: false,
    },
  },
};

export const ContinueOnDevice = (
  args: React.ComponentProps<typeof ContinueOnDeviceComponent>,
): JSX.Element => {
  return (
    <Flex flex={1}>
      <ContinueOnDeviceComponent {...args} />
    </Flex>
  );
};

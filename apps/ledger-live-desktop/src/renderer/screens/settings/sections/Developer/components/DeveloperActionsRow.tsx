import React from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import { Flex } from "@ledgerhq/react-ui";
import DeveloperClassicRow from "./DeveloperClassicRow";

type Action = {
  key: string;
  label: React.ReactNode;
  onClick: () => void;
  appearance?: "accent" | "transparent" | "red" | "base";
  dataTestId?: string;
};

type Props = {
  title: React.ReactNode;
  desc: React.ReactNode;
  actions: Action[];
  dataTestId?: string;
};

const DeveloperActionsRow = ({ title, desc, actions, dataTestId }: Props) => (
  <DeveloperClassicRow title={title} desc={desc} dataTestId={dataTestId}>
    <Flex flexDirection="row" columnGap={3}>
      {actions.map(action => (
        <Button
          key={action.key}
          size="sm"
          appearance={action.appearance ?? "accent"}
          onClick={action.onClick}
          data-testid={action.dataTestId}
        >
          {action.label}
        </Button>
      ))}
    </Flex>
  </DeveloperClassicRow>
);

export default DeveloperActionsRow;

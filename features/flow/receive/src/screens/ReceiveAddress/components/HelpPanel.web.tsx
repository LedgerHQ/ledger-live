import React from "react";
import {
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  Spot,
} from "@ledgerhq/lumen-ui-react";
import { Question } from "@ledgerhq/lumen-ui-react/symbols";
import type { HelpPanelProps } from "./HelpPanel.types";

export function HelpPanel({ helpPanel }: HelpPanelProps) {
  return (
    <div className="-mx-8 flex flex-col" data-testid="receive-address-help-panel">
      {helpPanel.questions.map(question => (
        <ListItem
          key={question.id}
          onClick={question.onPress}
          data-testid={`receive-address-help-${question.id}`}
        >
          <ListItemLeading>
            <Spot icon={Question} size={40} />
            <ListItemContent>
              <ListItemTitle>{question.label}</ListItemTitle>
            </ListItemContent>
          </ListItemLeading>
        </ListItem>
      ))}
    </div>
  );
}

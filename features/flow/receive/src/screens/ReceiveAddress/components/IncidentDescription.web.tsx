import React from "react";
import { Link } from "@ledgerhq/lumen-ui-react";
import type { IncidentDescriptionProps } from "./IncidentDescription.types";

export function IncidentDescription({ parts }: IncidentDescriptionProps) {
  return parts.map(part =>
    part.onPress ? (
      <Link key={part.text} asChild appearance="inherit" size="inherit" underline>
        <button type="button" className="cursor-pointer" onClick={part.onPress}>
          {part.text}
        </button>
      </Link>
    ) : (
      <React.Fragment key={part.text}>{part.text}</React.Fragment>
    ),
  );
}

import React from "react";
import { VerticalTimeline as VerticalTimelineBase } from "@ledgerhq/react-ui";

export { VerticalTimelineBase as VerticalTimeline };

type SubtitleTextProps = React.ComponentProps<typeof VerticalTimelineBase.SubtitleText> & {
  children?: React.ReactNode;
};

/** Typed to accept children (styled-components omit it with React 19). Use this instead of VerticalTimeline.SubtitleText. */
export const SubtitleText =
  VerticalTimelineBase.SubtitleText as React.ComponentType<SubtitleTextProps>;

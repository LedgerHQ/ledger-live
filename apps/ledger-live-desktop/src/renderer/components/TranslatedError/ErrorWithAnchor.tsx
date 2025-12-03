import React from "react";
import { Link } from "@ledgerhq/react-ui/index";
import {
  useHtmlLinkSegments,
  type HtmlLinkSegment,
} from "@ledgerhq/live-common/hooks/useHtmlLinkSegments";
import { openURL } from "~/renderer/linking";
import uniqueId from "lodash/uniqueId";
type ErrorWithAnchorContentProps = Readonly<{
  html: string;
  dataTestId?: string;
}>;

export function ErrorWithAnchorContent({
  html,
  dataTestId,
}: ErrorWithAnchorContentProps): JSX.Element {
  const { segments }: { segments: HtmlLinkSegment[] } = useHtmlLinkSegments(html);

  const handleLinkClick = (href: string) => {
    openURL(href);
  };

  return (
    <span data-testid={dataTestId}>
      {segments.map((segment: HtmlLinkSegment) => {
        const uuid = uniqueId();
        return segment.type === "link" ? (
          <Link
            color="palette.text.warning"
            alwaysUnderline
            key={uuid}
            onClick={() => handleLinkClick(segment.href)}
          >
            {segment.label}
          </Link>
        ) : (
          <span key={uuid}>{segment.content}</span>
        );
      })}
    </span>
  );
}

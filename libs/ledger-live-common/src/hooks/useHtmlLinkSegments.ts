import { useMemo } from "react";

export type HtmlLinkSegment =
  | {
      type: "text";
      content: string;
    }
  | {
      type: "link";
      label: string;
      href: string;
    };

const ANCHOR_OPEN_REGEX = /<a\b[^>]*>/gi;
const HREF_ATTR_REGEX = /href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s'">]+))/i;
const CLOSING_ANCHOR = "</a>";

export const splitHtmlLinkSegments = (input: string): HtmlLinkSegment[] => {
  const segments: HtmlLinkSegment[] = [];

  if (!input) {
    return segments;
  }

  const lowerInput = input.toLowerCase();
  let cursor = 0;
  ANCHOR_OPEN_REGEX.lastIndex = 0;

  const extractHrefValue = (tag: string): string | null => {
    const match = tag.match(HREF_ATTR_REGEX);
    if (!match) return null;
    return match[1] ?? match[2] ?? match[3] ?? null;
  };

  let match: RegExpExecArray | null;
  while ((match = ANCHOR_OPEN_REGEX.exec(input)) !== null) {
    const startIndex = match.index;
    const tag = match[0];
    const contentStartIndex = startIndex + tag.length;
    const closingIndex = lowerInput.indexOf(CLOSING_ANCHOR, contentStartIndex);

    if (closingIndex === -1) {
      break;
    }

    if (startIndex > cursor) {
      const textBefore = input.slice(cursor, startIndex);
      if (textBefore) {
        segments.push({
          type: "text",
          content: textBefore,
        });
      }
    }

    const href = extractHrefValue(tag);
    if (href) {
      const label = input.slice(contentStartIndex, closingIndex);
      segments.push({
        type: "link",
        href,
        label,
      });
    } else {
      const fallbackText = input.slice(startIndex, closingIndex + CLOSING_ANCHOR.length);
      segments.push({
        type: "text",
        content: fallbackText,
      });
    }

    cursor = closingIndex + CLOSING_ANCHOR.length;
    ANCHOR_OPEN_REGEX.lastIndex = cursor;
  }

  if (cursor < input.length) {
    const textAfter = input.slice(cursor);
    if (textAfter) {
      segments.push({
        type: "text",
        content: textAfter,
      });
    }
  }

  return segments;
};

export const validateLedgerUrl = (
  href: string,
): { isHttp: boolean; isAllowedLedgerDomain: boolean } => {
  try {
    const url = new URL(href);
    const isHttp = url.protocol === "http:" || url.protocol === "https:";

    if (!isHttp) {
      return {
        isHttp: false,
        isAllowedLedgerDomain: false,
      };
    }

    const hostname = url.hostname.toLowerCase();
    const isAllowedLedgerDomain = hostname === "ledger.com" || hostname.endsWith(".ledger.com");

    return {
      isHttp,
      isAllowedLedgerDomain,
    };
  } catch {
    return {
      isHttp: false,
      isAllowedLedgerDomain: false,
    };
  }
};

export const buildHtmlDisplaySegments = (input: string): HtmlLinkSegment[] => {
  return splitHtmlLinkSegments(input).map(segment => {
    if (segment.type === "link") {
      const { isHttp, isAllowedLedgerDomain } = validateLedgerUrl(segment.href);

      if (isHttp && isAllowedLedgerDomain) {
        return segment;
      }

      return {
        type: "text",
        content: segment.label,
      };
    }

    return segment;
  });
};

export const useHtmlLinkSegments = (
  html?: string | null,
): {
  segments: HtmlLinkSegment[];
  hasLinks: boolean;
} => {
  return useMemo(() => {
    if (!html) {
      return {
        segments: [],
        hasLinks: false,
      };
    }

    const segments = buildHtmlDisplaySegments(html);

    return {
      segments,
      hasLinks: segments.some(segment => segment.type === "link"),
    };
  }, [html]);
};

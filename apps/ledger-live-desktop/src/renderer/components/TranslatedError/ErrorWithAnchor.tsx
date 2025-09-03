import React from "react";
import { Link } from "@ledgerhq/react-ui/index";
import { openURL } from "~/renderer/linking";

function validateLedgerUrl(href: string): { isHttp: boolean; isAllowedLedgerDomain: boolean } {
  try {
    const url = new URL(href);
    const isHttp = url.protocol === "http:" || url.protocol === "https:";
    if (!isHttp) return { isHttp: false, isAllowedLedgerDomain: false };

    const hostname = url.hostname.toLowerCase();
    const isLedger = hostname === "ledger.com" || hostname.endsWith(".ledger.com");
    const isLedgerSupport =
      hostname === "ledger-support.com" || hostname.endsWith(".ledger-support.com");

    return { isHttp: true, isAllowedLedgerDomain: isLedger || isLedgerSupport };
  } catch (_) {
    return { isHttp: false, isAllowedLedgerDomain: false };
  }
}

export function renderWithLinks(input: string): React.ReactNode {
  const nodes: React.ReactNode[] = [];
  const regex = /<a\s+[^>]*href=['"]([^'"\s>]+)['"][^>]*>(.*?)<\/a>/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(input)) !== null) {
    const [full, href, label] = match;
    const start = match.index;
    if (start > lastIndex) {
      nodes.push(
        <React.Fragment key={`text-${key}`}>{input.slice(lastIndex, start)}</React.Fragment>,
      );
    }
    const { isHttp, isAllowedLedgerDomain } = validateLedgerUrl(href);

    const handleOpenUrl = () => {
      openURL(href);
    };

    if (isHttp && isAllowedLedgerDomain) {
      nodes.push(
        <Link color="palette.text.warning" alwaysUnderline key={`a-${key}`} onClick={handleOpenUrl}>
          {label}
        </Link>,
      );
    } else {
      nodes.push(<span key={`label-${key}`}>{label}</span>);
    }
    key += 1;
    lastIndex = start + full.length;
  }
  if (lastIndex < input.length) {
    nodes.push(<React.Fragment key={`text-final-${key}`}>{input.slice(lastIndex)}</React.Fragment>);
  }
  return nodes.length ? nodes : input;
}

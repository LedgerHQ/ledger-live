import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { darken, lighten } from "~/renderer/styles/helpers";
import IconCopy from "~/renderer/icons/Copy";
import Box from "~/renderer/components/Box";
let clipboard: Electron.Clipboard | null = null;
if (!process.env.STORYBOOK_ENV) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const electron = require("electron");
  clipboard = electron.clipboard; // eslint-disable-line
}
type Props = {
  text: string;
};

const CopyWithFeedback = ({ text }: Props) => {
  const { t } = useTranslation();
  const [isCopied, setIsCopied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmountedRef = useRef(false);

  useEffect(() => {
    return () => {
      isUnmountedRef.current = true;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleCopy = () => {
    if (clipboard) clipboard.writeText(text);
    setIsCopied(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      if (!isUnmountedRef.current) {
        setIsCopied(false);
      }
    }, 1e3);
  };

  return (
    <ClickableWrapper onClick={handleCopy}>
      <IconCopy size={16} />
      <span>{isCopied ? t("common.copied") : t("common.copy")}</span>
    </ClickableWrapper>
  );
};
const ClickableWrapper = styled(Box).attrs(() => ({
  horizontal: true,
  alignItems: "center",
  flow: 1,
  color: "wallet",
  fontSize: 4,
  ff: "Inter|SemiBold",
  cursor: "default", // this here needs reset because it inherits from cursor: text from parent
}))`
  &:hover {
    color: ${p => lighten(p.theme.colors.wallet, 0.1)};
  }
  &:active {
    color: ${p => darken(p.theme.colors.wallet, 0.1)};
  }
`;
export default CopyWithFeedback;

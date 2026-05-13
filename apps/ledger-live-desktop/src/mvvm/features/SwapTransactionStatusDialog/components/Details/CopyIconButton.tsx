import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Copy } from "@ledgerhq/lumen-ui-react/symbols";
import { useCopyToClipboard } from "LLD/hooks/useCopyToClipboard";

type CopyIconButtonProps = Readonly<{
  text: string;
}>;

export function CopyIconButton({ text }: CopyIconButtonProps) {
  const { t } = useTranslation();
  const [isCopied, setIsCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const copyToClipboard = useCopyToClipboard(() => {
    setIsCopied(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsCopied(false), 1_000);
  });

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <>
      <button
        type="button"
        className="inline-flex cursor-pointer border-0 bg-transparent p-0 text-base hover:text-interactive"
        aria-label={t("swap2.modals.transactionStatus.accessibility.copySwapId")}
        onClick={() => copyToClipboard(text)}
      >
        <Copy size={16} />
      </button>
      {isCopied ? (
        <div className="pointer-events-none fixed inset-0 z-[10000] flex items-center justify-center">
          <div
            role="status"
            aria-live="polite"
            className="rounded-sm bg-base px-16 py-8 body-2-semi-bold text-inverted"
          >
            {t("swap2.modals.transactionStatus.actions.copied")}
          </div>
        </div>
      ) : null}
    </>
  );
}

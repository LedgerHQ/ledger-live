import React from "react";
import { Trans } from "react-i18next";
import { cva } from "class-variance-authority";
import { cn } from "LLD/utils/cn";
import type { AmountScreenMessage } from "../types";

const messageStyles = cva("text-center body-2", {
  variants: {
    type: {
      error: "text-error",
      warning: "text-warning",
      info: "text-base",
    },
  },
});

type AmountMessageTextProps = Readonly<{
  message: AmountScreenMessage | null | undefined;
  onLinkPress?: (link: string) => void;
}>;

function getErrorLinks(error: unknown): string[] {
  if (!error || typeof error !== "object" || !("links" in error) || !Array.isArray(error.links)) {
    return [];
  }

  return error.links.filter((link): link is string => typeof link === "string");
}

export function AmountMessageText({ message, onLinkPress }: AmountMessageTextProps) {
  const error = message?.error instanceof Error ? message.error : undefined;

  const linkComponents = React.useMemo(() => {
    const links = getErrorLinks(error);
    return Object.fromEntries(
      links.map((link, index) => [
        `link${index}`,
        <button
          key={`${link}-${index}`}
          type="button"
          onClick={() => onLinkPress?.(link)}
          className="inline cursor-pointer border-0 bg-transparent p-0 font-inherit text-inherit underline"
          data-testid={`send-amount-message-link-${index}`}
        />,
      ]),
    );
  }, [error, onLinkPress]);

  if (!message) return null;

  return (
    <p className={cn(messageStyles({ type: message.type }))} data-testid="send-amount-message">
      {error ? (
        <Trans
          i18nKey={`errors.${error.name}.title`}
          defaults={message.text}
          values={{
            ...error,
            message: error.message,
          }}
          components={linkComponents}
        />
      ) : (
        message.text
      )}
    </p>
  );
}

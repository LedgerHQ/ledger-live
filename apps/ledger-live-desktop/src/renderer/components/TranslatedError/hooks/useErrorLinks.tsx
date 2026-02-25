import React, { ReactElement, useMemo } from "react";
import { useNavigate } from "react-router";
import * as S from "../styles";
import { openURL } from "~/renderer/linking";
import { getSafeStringLinks, isAbsoluteUrl } from "../utils";

export function useErrorLinks(error?: Error | null): Record<string, ReactElement> {
  const safeStringLinks = getSafeStringLinks(error);

  const navigate = useNavigate();
  return useMemo(() => {
    if (safeStringLinks.length > 0) {
      return safeStringLinks.reduce((prev, curr, index) => {
        if (isAbsoluteUrl(curr)) {
          return {
            ...prev,
            [`link${index}`]: (
              <a onClick={() => openURL(curr)} data-testid={`translated-error-link-${index}`} />
            ),
          };
        }

        // ledgerlive needed here to "mock" a valid url.
        // Allows easier splitting of pathname and searchParams.
        const { pathname, searchParams } = new URL(curr, "ledgerlive:/");

        return {
          ...prev,
          [`link${index}`]: (
            <S.Button
              onClick={() =>
                navigate(pathname, {
                  state: Object.fromEntries(searchParams.entries()),
                })
              }
              data-testid={`translated-error-link-${index}`}
            />
          ),
        };
      }, {});
    }

    return {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeStringLinks]);
}

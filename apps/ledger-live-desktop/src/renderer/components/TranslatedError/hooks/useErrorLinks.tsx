import React, { useMemo } from "react";
import { useHistory } from "react-router";
import * as S from "../styles";
import { openURL } from "~/renderer/linking";

function isAbsoluteUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

export function useErrorLinks(error?: Error | null) {
  const errorLinks = error && "links" in error && Array.isArray(error.links) && error?.links;
  const history = useHistory();
  return useMemo(() => {
    if (errorLinks) {
      const safeStringLinks = errorLinks.filter((link): link is string => typeof link === "string");

      return safeStringLinks.reduce((prev, curr, index) => {
        if (isAbsoluteUrl(curr)) {
          return {
            ...prev,
            [`link${index}`]: (
              <a onClick={() => openURL(curr)} data-test-id={`translated-error-link-${index}`} />
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
                history.push({
                  pathname,
                  state: Object.fromEntries(searchParams.entries()),
                })
              }
              data-test-id={`translated-error-link-${index}`}
            />
          ),
        };
      }, {});
    }

    return {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorLinks]);
}

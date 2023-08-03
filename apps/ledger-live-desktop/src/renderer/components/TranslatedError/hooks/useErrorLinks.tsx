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
        const link = isAbsoluteUrl(curr) ? (
          <a onClick={() => openURL(curr)} data-test-id={`translated-error-link-${index}`} />
        ) : (
          <S.Button
            onClick={() =>
              history.push({
                pathname: curr,
              })
            }
            data-test-id={`translated-error-link-${index}`}
          />
        );

        return {
          ...prev,
          [`link${index}`]: link,
        };
      }, {});
    }

    return {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorLinks]);
}

import React from "react";
import { Link } from "@ledgerhq/react-ui";
import { Trans } from "react-i18next";
import { openURL } from "~/renderer/linking";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";

type LearnMoreCtaProps = {
  size?: "small" | "medium" | "large";
  color?: string;
  style?: React.CSSProperties;
  Icon?: React.ComponentType<{ size: number; color?: string }>;
  url: string;
};

const LearnMoreCta = ({
  size = "small",
  color = "neutral.c80",
  style,
  Icon,
  url,
}: LearnMoreCtaProps) => {
  const localizedUrl = useLocalizedUrl(url);

  if (!localizedUrl) return null;

  const handleOpenLMLink = () => openURL(localizedUrl);

  return (
    <Link
      size={size}
      color={color}
      onClick={handleOpenLMLink}
      style={style}
      {...(Icon && { Icon })}
    >
      <Trans i18nKey="common.memoTag.learnMore" />
    </Link>
  );
};

export default LearnMoreCta;

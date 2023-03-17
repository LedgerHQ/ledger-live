import React from "react";
import { Alert, Flex, Link, Text } from "@ledgerhq/react-ui";
import Button from "~/renderer/components/ButtonV3";
import { openURL } from "~/renderer/linking";

export type BannerProps =
  | {
      title: string;
      linkText?: string;
      linkUrl?: string;
      description: string;
      cta: string;
      onClick: () => void;
      display: true;
    }
  | { display: false };

const AccountBanner = (props: BannerProps) => {
  if (!props.display) return null;
  const { title, linkText, linkUrl, description, cta, onClick } = props;

  return (
    <Alert
      type="info"
      showIcon={false}
      containerProps={{ mt: -4, mb: 4, mx: 0, p: 12 }}
      renderContent={() => (
        <Flex data-test-id="account-stake-banner" style={{ alignItems: "center", width: "100%" }}>
          <Flex style={{ flex: 1, flexDirection: "column" }}>
            <Text color="inherit" variant="body" fontWeight="bold" fontSize="14px">
              {title}
            </Text>
            <Text
              color="inherit"
              variant="body"
              fontSize="14px"
              style={{ marginTop: "10px", lineHeight: 1 }}
            >
              {description}{" "}
              {linkUrl && linkText && (
                <Link
                  color="inherit"
                  style={{ marginTop: "10px", textDecoration: "underline" }}
                  onClick={() =>
                    openURL(linkUrl, "button_click", { button: "learn_more", page: "Page Account" })
                  }
                >{`${linkText}`}</Link>
              )}
            </Text>
          </Flex>
          <Button
            variant="color"
            ml={12}
            onClick={onClick}
            buttonTestId="account-stake-banner-button"
          >
            {cta}
          </Button>
        </Flex>
      )}
    />
  );
};

export { AccountBanner };

import React, { memo, useState, useCallback } from "react";
import { TouchableOpacity } from "react-native";
import { Flex, Text, Icon as IconUI } from "@ledgerhq/native-ui";
import { IconType } from "@ledgerhq/native-ui/components/Icon/type";
import QueuedDrawer from "~/components/QueuedDrawer";
import { MarketListRequestParams } from "@ledgerhq/live-common/market/types";
import { StyledBadge, StyledCheckIconContainer } from "./SortBadge.styled";

type Option = {
  label: string;
  value: unknown;
  requestParam: MarketListRequestParams;
};

type Props = {
  label: string;
  valueLabel: string;
  value: unknown;
  Icon?: IconType;
  options: Option[];
  disabled?: boolean;
  onChange: (_: MarketListRequestParams) => void;
};

function SortBadge({ label, valueLabel, value, Icon, options, disabled, onChange }: Props) {
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);

  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  return (
    <>
      <TouchableOpacity disabled={disabled} onPress={openDrawer}>
        <StyledBadge>
          <Text mr={2} fontWeight="semiBold" variant="body">
            {label}
          </Text>
          <Text fontWeight="semiBold" variant="body" color="primary.c80">
            {valueLabel}
          </Text>
          {Icon ? (
            <Flex ml={2}>
              <Icon size={14} color="primary.c80" />
            </Flex>
          ) : null}
        </StyledBadge>
      </TouchableOpacity>
      <QueuedDrawer isRequestingToBeOpened={isDrawerOpen} onClose={closeDrawer} title={label}>
        {options.map(({ label, value: optValue, requestParam }: Option, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => {
              onChange(requestParam);
              closeDrawer();
            }}
          >
            <Flex
              flexDirection="row"
              justifyContent="space-between"
              alignItems="center"
              height="48px"
              my={2}
            >
              <Text
                variant="body"
                fontWeight="semiBold"
                color={value === optValue ? "primary.c80" : "neutral.c100"}
              >
                {label}
              </Text>
              {value === optValue ? (
                <StyledCheckIconContainer>
                  <IconUI name="CheckAlone" size={12} color="background.main" />
                </StyledCheckIconContainer>
              ) : null}
            </Flex>
          </TouchableOpacity>
        ))}
      </QueuedDrawer>
    </>
  );
}

export default memo<Props>(SortBadge);

import React, { memo, useState, useCallback } from "react";
import { TouchableOpacity } from "react-native";
import styled from "styled-components/native";
import { Flex, Text, Icon as IconUI } from "@ledgerhq/native-ui";
import { IconType } from "@ledgerhq/native-ui/components/Icon/type";
import QueuedDrawer from "../../components/QueuedDrawer";

export const Badge = styled(Flex).attrs((p: { bg?: string }) => ({
  bg: p.bg ?? "neutral.c30",
  flexDirection: "row",
  mx: "6px",
  px: 4,
  py: 1,
  justifyContent: " center",
  alignItems: "center",
  height: 32,
}))`
  border-radius: 32px;
`;

const CheckIconContainer = styled(Flex).attrs({
  bg: "primary.c80",
  flexDirection: "row",
  justifyContent: " center",
  alignItems: "center",
  height: 24,
  width: 24,
})`
  border-radius: 24px;
`;

type Option = {
  label: string;
  value: unknown;
  requestParam: unknown;
};

type Props = {
  label: string;
  valueLabel: string;
  value: unknown;
  Icon?: IconType;
  options: Option[];
  disabled?: boolean;
  onChange: (_: unknown) => void;
};

function SortBadge({
  label,
  valueLabel,
  value,
  Icon,
  options,
  disabled,
  onChange,
}: Props) {
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);

  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  return (
    <>
      <TouchableOpacity disabled={disabled} onPress={openDrawer}>
        <Badge>
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
        </Badge>
      </TouchableOpacity>
      <QueuedDrawer
        isRequestingToBeOpened={isDrawerOpen}
        onClose={closeDrawer}
        title={label}
      >
        {options.map(
          ({ label, value: optValue, requestParam }: Option, index) => (
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
                  <CheckIconContainer>
                    <IconUI
                      name="CheckAlone"
                      size={12}
                      color="background.main"
                    />
                  </CheckIconContainer>
                ) : null}
              </Flex>
            </TouchableOpacity>
          ),
        )}
      </QueuedDrawer>
    </>
  );
}

export default memo<Props>(SortBadge);

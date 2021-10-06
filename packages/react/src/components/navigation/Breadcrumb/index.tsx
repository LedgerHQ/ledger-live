import React, { memo } from "react";
import styled, { useTheme } from "styled-components";
import Flex from "@components/layout/Flex";
import Text from "@components/asorted/Text";
import Dropdown from "@components/form/selectDialogs/Dropdown";

export type Props = { segments: Segment[]; onChange: (values: string[]) => void }; //React.PropsWithChildren<unknown>;
export type Element = {
  label: string;
  value: string;
};
export type Elements = {
  value: Element;
  options: Element[];
};
export type Segment = Element | Elements;

const Link = styled(Text).attrs({
  ff: "Inter|SemiBold",
  fontSize: 3,
  color: "palette.neutral.c80",
  tabIndex: 0,
})`
  cursor: pointer;
  :hover,
  :active,
  :focus {
    color: ${(p) => p.theme.colors.palette.neutral.c100};
    text-decoration: underline;
  }
`;

function isMultiSegment(segment: Segment): segment is Elements {
  return (segment as Elements).options !== undefined;
}

export default memo(function Breadcrumb({ segments, onChange }: Props): JSX.Element {
  const theme = useTheme();
  const [contents] = segments.reduce<[React.ReactNode[], string[]]>(
    ([renderArray, valuesArray], segment, index) => {
      const values = [...valuesArray];

      renderArray.push(
        <>
          {index > 0 ? (
            <Text ff="Inter|SemiBold" color="palette.neutral.c40" fontSize={3}>
              /
            </Text>
          ) : null}
          {isMultiSegment(segment) ? (
            <Dropdown
              label=""
              options={segment.options}
              value={segment.value}
              onChange={(elt) => elt && onChange([...values, elt.value])}
              styles={{
                singleValue: (provided) => ({
                  ...provided,
                  color: theme.colors.palette.neutral.c80,
                  margin: 0,
                  top: undefined,
                  position: undefined,
                  overflow: undefined,
                  maxWidth: undefined,
                  transform: undefined,
                  cursor: "pointer",
                  ":hover": {
                    color: theme.colors.palette.neutral.c100,
                    textDecoration: "underline",
                  },
                }),
              }}
            />
          ) : (
            <Link
              onKeyDown={(event: React.KeyboardEvent<HTMLSpanElement>) =>
                ["Enter", " "].includes(event.key) && onChange([...values, segment.value])
              }
              onClick={() => onChange([...values, segment.value])}
            >
              {segment.label}
            </Link>
          )}
        </>,
      );

      valuesArray.push(isMultiSegment(segment) ? segment.value.value : segment.value);
      return [renderArray, valuesArray];
    },
    [[], []],
  );

  return (
    <Flex columnGap={5} alignItems="center">
      {contents}
    </Flex>
  );
});

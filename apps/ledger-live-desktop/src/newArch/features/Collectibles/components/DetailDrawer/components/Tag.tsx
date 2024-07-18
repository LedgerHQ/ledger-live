import React, { useMemo } from "react";
import Text from "~/renderer/components/Text";
import styled from "styled-components";
import { Skeleton } from "LLD/features/Collectibles/components/index";
import { FieldStatus, TagProps } from "LLD/features/Collectibles/types/DetailDrawer";

const PropertiesContainer = styled.div<{ isNewDesign?: boolean }>`
  display: flex;
  flex-direction: row;
  flex-wrap: ${({ isNewDesign }) => (isNewDesign ? "nowrap" : "wrap")};
  row-gap: 12px;
  column-gap: 16px;
  overflow-x: ${({ isNewDesign }) => (isNewDesign ? "auto" : "hidden")};
  white-space: ${({ isNewDesign }) => (isNewDesign ? "nowrap" : "normal")};
`;
const Property = styled.div<{ isNewDesign?: boolean }>`
  display: inline-flex;
  flex-direction: column;
  padding: 8px 12px;
  background: ${({ isNewDesign, theme }) =>
    isNewDesign ? theme.colors.opacityDefault.c05 : "rgba(138, 128, 219, 0.1)"};
  border-radius: 4px;
`;
const Separator = styled.div`
  width: 100%;
  height: 1px;
  background-color: ${({ theme }) => theme.colors.palette.text.shade10};
  margin: 24px 0px;
`;

const TagComponent: React.FC<TagProps> = ({ tags, sectionTitle, status, isNewDesign }) => {
  const skeletonCount = 7;
  const showSkeleton = useMemo(() => status === FieldStatus.Loading, [status]);

  const skeletons = useMemo(
    () =>
      Array.from({ length: skeletonCount }, (_, index) => (
        <Skeleton key={index} width={66} barHeight={50} show={showSkeleton} />
      )),
    [showSkeleton],
  );

  if ((tags && tags?.length === 0) || !tags) return null;

  return (
    <>
      <Text
        mb="12px"
        lineHeight="17px"
        fontSize="14px"
        color="palette.text.shade50"
        ff="Inter|SemiBold"
      >
        {sectionTitle}
      </Text>
      <PropertiesContainer isNewDesign={isNewDesign}>
        {tags
          ? tags.map(({ key, value }) => (
              <Property key={key + value} isNewDesign={isNewDesign}>
                <Text
                  mb="2px"
                  lineHeight="12.1px"
                  fontSize={2}
                  color={isNewDesign ? "palette.text.shade50" : "rgba(138, 128, 219, 0.5);"}
                  ff="Inter|SemiBold"
                  uppercase
                >
                  {key}
                </Text>
                <Text
                  mb="2px"
                  lineHeight="16.94px"
                  fontSize={4}
                  color={isNewDesign ? "neutral.c100" : "#8a80db"}
                  ff="Inter|Regular"
                >
                  {value}
                </Text>
              </Property>
            ))
          : skeletons}
      </PropertiesContainer>
      {!isNewDesign ? <Separator /> : null}
    </>
  );
};

export const Tag = TagComponent;

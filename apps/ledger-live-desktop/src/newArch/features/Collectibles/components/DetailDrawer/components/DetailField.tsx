import React, { memo } from "react";
import { Skeleton } from "LLD/features/Collectibles/components/Skeleton";
import { DetailFieldProps } from "LLD/features/Collectibles/types/DetailDrawer";
import { CopyableField } from ".";
import Text from "~/renderer/components/Text";
import styled from "styled-components";
import { SplitAddress } from "~/renderer/components/OperationsList/AddressCell";
import { useTranslation } from "react-i18next";

const Separator = styled.div`
  width: 100%;
  height: 1px;
  background-color: ${({ theme }) => theme.colors.palette.text.shade10};
  margin: 24px 0px;
`;

const Container = styled.div<{ isHorizontal?: boolean }>`
  width: 100%;
  display: flex;
  flex-direction: ${({ isHorizontal }) => (isHorizontal ? "row" : "column")};
  justify-content: space-between;
`;

const ValueBox = styled.div<{ isHorizontal?: boolean }>`
  width: 100%;
  align-self: end;
  display: ${({ isHorizontal }) => (isHorizontal ? "flex" : "block")};
  justify-content: ${({ isHorizontal }) => (isHorizontal ? "flex-end" : "flex-start")};
`;

const Pre = styled.span`
  white-space: pre-line;
  display: block;
  unicode-bidi: embed;
  word-break: break-word;
  line-height: 15px;
`;

const HashContainer = styled.div`
  word-break: break-all;
  user-select: text;
  width: 100%;
  min-width: 100px;
`;

const DetailFieldComponent: React.FC<DetailFieldProps> = ({
  label,
  value,
  hasSeparatorTop,
  hasSeparatorBottom,
  isHorizontal,
  isCopyable,
  isLoading,
  isHash,
  id,
}: DetailFieldProps) => {
  const { t } = useTranslation();

  if (!value) return null;

  return (
    <>
      {hasSeparatorTop && <Separator />}
      <Container isHorizontal={isHorizontal}>
        <Text
          mb={1}
          lineHeight="15.73px"
          fontSize={4}
          color="palette.text.shade60"
          ff="Inter|SemiBold"
        >
          {t(label)}
        </Text>
        {value ? (
          <Skeleton show={isLoading} width={100} barHeight={10} minHeight={24}>
            <ValueBox isHorizontal={isHorizontal}>
              <Text
                data-testid={`nft-${id}`}
                lineHeight="15.73px"
                fontSize={4}
                color="palette.text.shade100"
                ff="Inter|Regular"
              >
                {isCopyable ? (
                  <CopyableField value={value}>
                    {!isHash ? (
                      value
                    ) : (
                      <HashContainer>
                        <SplitAddress value={value} ff="Inter|Regular" />
                      </HashContainer>
                    )}
                  </CopyableField>
                ) : (
                  <Pre>{value}</Pre>
                )}
              </Text>
            </ValueBox>
          </Skeleton>
        ) : null}
      </Container>
      {hasSeparatorBottom && <Separator />}
    </>
  );
};

export const DetailField = memo<DetailFieldProps>(DetailFieldComponent);

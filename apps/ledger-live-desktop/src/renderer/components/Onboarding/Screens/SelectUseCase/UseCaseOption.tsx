import React from "react";
import styled from "styled-components";
import { Flex, Button, Text, Icons } from "@ledgerhq/react-ui";

const IllustrationContainer = styled(Flex).attrs({
  flexDirection: "column",
  alignSelf: "center",
})``;

const TitleText = styled(Text).attrs(() => ({
  fontSize: "20px",
  mb: "12px",
  uppercase: true,
}))``;

const DescriptionText = styled(Text).attrs(() => ({}))``;

// TODO: use proper button styling once all styles are covered in the design sys
const ArrowButton = styled(Button).attrs(() => ({
  variant: "main",
  size: "medium",
  Icon: Icons.ArrowRightMedium,
  iconButton: true,
}))`
  margin-top: 27px;
  margin-right: 12px;
  align-self: flex-end;
`;

const Container = styled(Flex).attrs({
  width: "100%",
  padding: "20px",
  border: "1px solid",
  borderColor: "neutral.c40",
  position: "relative",
  boxSizing: "border-box",
  flexDirection: "column",
})`
  text-align: left;
`;

// TODO: add button hover behavior for the ArrowButton
const UseCaseOptionContainer = styled.button`
  border: none;
  outline: none;
  width: 301px;
  box-sizing: border-box;
  background-color: transparent;
  position: relative;
  cursor: pointer;

  &:hover ${TitleText} {
    text-decoration: underline;
  }
`;

interface UseCaseOptionProps {
  title: React.ReactNode;
  description: React.ReactNode;
  illustration: React.ReactNode;
  onClick: () => void;
  id?: string;
  dataTestId: string;
}

export function UseCaseOption({
  title,
  description,
  illustration,
  onClick,
  id,
  dataTestId,
}: UseCaseOptionProps) {
  return (
    <UseCaseOptionContainer data-test-id={dataTestId} id={id} onClick={onClick}>
      <Container>
        <IllustrationContainer>{illustration}</IllustrationContainer>
        <TitleText variant="h3">{title}</TitleText>
        <DescriptionText variant="paragraph" fontWeight="medium">
          {description}
        </DescriptionText>
        <ArrowButton />
      </Container>
    </UseCaseOptionContainer>
  );
}

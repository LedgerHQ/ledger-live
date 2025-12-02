import React from "react";
import styled from "styled-components";
import BigSpinner from "~/renderer/components/BigSpinner";

const LoaderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

type SwapLoaderProps = {
  isLoading: boolean;
};

export function SwapLoader({ isLoading }: SwapLoaderProps) {
  if (!isLoading) return null;

  return (
    <LoaderContainer>
      <BigSpinner size={50} />
    </LoaderContainer>
  );
}

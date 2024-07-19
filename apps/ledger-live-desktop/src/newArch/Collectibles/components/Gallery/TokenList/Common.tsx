import styled from "styled-components";
import Text from "~/renderer/components/Text";

export const TitleContainer = styled(Text)`
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
`;

export const Dots = styled.div`
  justify-content: flex-end;
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 5px;
  color: ${p => p.theme.colors.palette.text.shade50};
  &:hover {
    color: ${p => p.theme.colors.palette.text.shade80};
  }
`;

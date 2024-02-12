import styled from "styled-components";

export const SmallButton = styled.div`
  user-select: none;
  background: hsla(0, 0%, 0%, 0.5);
  padding: 5px;
  border-radius: 4px;
  user-select: none;
  &:hover {
    background: hsla(0, 0%, 100%, 0.1);
    color: hsla(0, 0%, 100%, 0.9);
  }
  &:active {
    background: hsla(0, 0%, 100%, 0.05);
    padding-top: 6px;
    padding-bottom: 4px;
  }
`;
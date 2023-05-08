import styled from "styled-components";
export default styled.div<{ of?: number; grow?: boolean }>`
  height: ${p => `${p.of}px` || "auto"};
  flex-grow: ${p => (p.grow ? 1 : 0)};
`;

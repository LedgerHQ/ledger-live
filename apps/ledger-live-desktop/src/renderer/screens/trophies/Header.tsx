import React from "react";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";

const Container = styled(Box)`
  margin-bottom: 40px;
`;

const Title = styled(Text)`
  background: linear-gradient(
    135deg,
    ${p => p.theme.colors.palette.primary.main},
    ${p => p.theme.colors.palette.secondary.main}
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 12px;
`;

const Subtitle = styled(Text)`
  color: ${p => p.theme.colors.palette.text.shade60};
  font-size: 16px;
  line-height: 1.5;
`;

export default function Header() {
  return (
    <Container>
      <Title>🏆 Trophies & Achievements</Title>
      <Subtitle>
        Track your progress and unlock achievements as you explore the world of crypto with Ledger
        Live. Complete challenges, reach milestones, and earn exclusive trophies to showcase your
        Web3 journey.
      </Subtitle>
    </Container>
  );
}

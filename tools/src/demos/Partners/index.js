// @flow
import React, { Component } from "react";
import styled from "styled-components";
import icons from "@ledgerhq/live-common/lib/partners/react";

const Section = styled.div`
  padding: 20px 40px;
`;

const Intro = styled.div`
  color: ${p => (p.dark ? "white" : "#142533")};
  margin-top: 20px;
  padding: 40px 40px;
  font-size: 16px;
`;

const LogoWrapper = styled.div`
  padding: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid #142533;
  outline: 1px solid white;
  &:empty {
    background-color: #cc0000;
  }
`;

const PartnersContainer = styled.div`
  display: grid;
  grid-template-columns: auto auto auto;
  grid-gap: 10px;
  margin-top: 20px;
`;

const SectionHeader = styled.h1`
  color: ${p => (p.dark ? "white" : "#142533")};
`;
const Button = styled.div`
  padding: 0.6em 1.2em;
  font-size: 16px;
  color: ${props => (props.disabled ? "#999" : "#fff")};
  background-color: ${props => (props.disabled ? "#eee" : "#6490f1")};
  border-radius: 4px;
  cursor: pointer;
  text-align: center;
`;

class Partners extends Component<*, { dark: boolean }> {
  state = {
    dark: false
  };

  static demo = {
    title: "Partners",
    url: "/partners",
    hidden: true
  };

  toggleDark = () => {
    this.setState(({ dark }) => ({ dark: !dark }));
  };

  openPartner = url => {
    window.location.href = url;
  };

  render() {
    const { dark } = this.state;
    return (
      <div style={{ backgroundColor: dark ? "#142533" : "white" }}>
        <Section>
          <SectionHeader dark={dark}>Partners</SectionHeader>
          <Intro dark={dark}>
            This shows a list of partner companies shown in the trade section of
            mobile/desktop apps
          </Intro>
          <Button onClick={this.toggleDark}>Toggle darkmode</Button>
          <PartnersContainer>
            {icons(dark).map(({ Logo, id, url }) => (
              <LogoWrapper
                key={id}
                title={id}
                onClick={() => this.openPartner(url)}
              >
                {Logo && <Logo width="300" />}
              </LogoWrapper>
            ))}
          </PartnersContainer>
        </Section>
      </div>
    );
  }
}

export default Partners;

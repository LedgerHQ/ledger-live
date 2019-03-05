// @flow
import React, { Component } from "react";
import styled from "styled-components";
import icons from "@ledgerhq/live-common/lib/partners/react";

const Section = styled.div`
  padding: 20px 40px;
`;

const Intro = styled.div`
  margin-top: 20px;
  padding: 0 40px;
  font-size: 16px;
`;

const LogoWrapper = styled.div`
  padding: 30px;
`;

const SectionHeader = styled.h1``;

class Partners extends Component<*, *> {
  static demo = {
    title: "Partners",
    url: "/partners"
  };



  render() {
    return (
      <div>
        <Intro>
          This shows a list of partner companies shown in the trade section of mobile/desktop apps
        </Intro>
        <Section>
          <SectionHeader>Companies</SectionHeader>
          {icons.map(({Logo, id, url})=><LogoWrapper key={id} partnerUrl={url}><Logo width="300"/></LogoWrapper>)}
        </Section>
      </div>
    );
  }
}

export default Partners;

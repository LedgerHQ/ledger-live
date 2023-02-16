import {render} from "@testing-library/react";
import React from "react";
import {StakeBanner} from "~/renderer/families/ethereum/StakeBanner";

describe('StakeBanner', () => {
  it('renders a kiln banner', () => {
    const account ={
    };
    const component = render(<StakeBanner account={account} />);
  });
});

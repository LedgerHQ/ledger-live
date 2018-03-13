import React from "react";
import renderer from "react-test-renderer";
import Root from ".";

// TODO we need to actually render App with a mock store so we can test screens
it("renders without crashing", async () => {
  const rendered = renderer.create(<Root />);
  const inst = rendered.getInstance();
  expect(inst.state.ready).toBe(false);
  expect(rendered.toJSON()).toBe(null); // initial state is loading...
  /*
  // TODO in the future
  for (let i = 0; !inst.state.ready && i < 30; i++) {
    await new Promise(success => setTimeout(success, 1000));
  }
  */
});

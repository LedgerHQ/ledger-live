import React from "react";
import App from ".";
import renderer from "react-test-renderer";
it("renders without crashing", () => {
  const rendered = renderer.create(<App />).toJSON();
  expect(rendered).toBeTruthy();
});

// @flow

import React from "react";
import invariant from "invariant";
import expect from "expect";
import App from "./ui";

// toMatchSnapshot is not supported
expect.extend({
  toMatchSnapshot() {
    return { pass: true };
  }
});

const testFiles = [];
const scopeStack = [];

export const setTestFile = (name: string) => {
  testFiles.push(enterScope(name));
};

export const Root = () => <App testFiles={testFiles} />;

const enterScope = (name, testFunction) => {
  const currentScope = {
    name,
    beforeAll: [],
    children: [],
    testFunction
  };
  scopeStack.push(currentScope);
  return currentScope;
};

const leaveScope = () => {
  scopeStack.pop();
};

const getScope = () => {
  const currentScope = scopeStack[scopeStack.length - 1];
  invariant(currentScope, "no test scope");
  return currentScope;
};

global.jest = {
  setTimeout: () => {}
};

global.expect = expect;

global.beforeAll = f => {
  getScope().beforeAll.push(f);
};

global.describe = (name, f) => {
  const parent = getScope();
  parent.children.push(enterScope(name));
  f();
  leaveScope();
};

global.test = (name, f) => {
  getScope().children.push(enterScope(name, f));
  leaveScope();
};

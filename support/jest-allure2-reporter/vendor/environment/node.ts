import JestEnvironmentNode from 'jest-metadata/environment-node';

import listener from './listener';

export const TestEnvironment = JestEnvironmentNode.derive(listener, 'WithAllure');

export default TestEnvironment;

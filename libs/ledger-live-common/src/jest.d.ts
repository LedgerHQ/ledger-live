declare namespace jest {
  interface Expect {
    toBeBigNumber(): CustomMatcherResult;
  }
}

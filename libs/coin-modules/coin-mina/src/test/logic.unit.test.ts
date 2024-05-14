import { getAccountNumFromPath, isValidAddress } from "../common-logic";

describe("getAccountNumFromPath", () => {
  it("should return undefined for invalid account number", () => {
    const account = getAccountNumFromPath("44'/616'/4'/0/0");
    expect(account).toBe(undefined);
  });

  it("should return undefined for unsupported path", () => {
    const account = getAccountNumFromPath("44'/616'/4/0/0");
    expect(account).toBe(undefined);
  });

  it("should return the account number", () => {
    const account = getAccountNumFromPath("44'/12586'/4'/0/0");
    expect(account).toBe(4);
  });
});

describe("testingAddress", () => {
  const validAddresses = [
    "B62qiVhtBtqakq8sNTHdCTXn6tETSK6gtsmNHRn1WdLqjGLpsHbw1xc",
    "B62qr5cXFjdnZXYxP5dEwRY7wENxcod4Q2oLxUDiq1QrBXZZyxMH8q4",
    "B62qqmRToRiXZjyLLMJoGnQFXXZuZWdqaNYr43xEDDQzkXMHLouCMZp",
    "B62qnixP59E4vJytpDWZ5YQPrnmqb7YNwhVWiuSAkxbYdX5RauHWwcm",
    "B62qmfBiJx88gM9opov4MDxmDVKMutQsBQ1aGt7TrQYyGQx66fRFxvC",
    "B62qosg21UpwpfPFaxTyirdfUVDHe2Ynsyv1QydE4z34zbLuBZ92ALM",
    "B62qkWUvsVEnXmd4poHbkKujHNnjxkDcZtrLxN1FTa8pp3GkfHMB1gv",
    "B62qoiK7DJurVUUJx1dmJGULdNUmX5bjdiYvoWXEXGugS2Cx3YDsHhy",
    "B62qn1KptFUxxu8aRS52NGQ3GWzn5h8v7U9k571r4LCs5obpoZyd81e",
    "B62qis2tX1rveddCeJeBAZJnXcCwWPp1x9ScZ3iMCxbV29gRbxWo7qi",
    "B62qpBKEDTnS4efjBmou7iztx5x152JEmc29XMR1Y3FVCpnmfKGX4R4",
    "B62qro5bGnk7eCNMA1S5QWmzn5sCcRWckbw83GGaqN3HM2QzP9zYS83",
    "B62qospDjUj43x2yMKiNehojWWRUsE1wpdUDVpfxH8V3n5Y1QgJKFfw",
    "B62qrmYwToypQv8v9cjxJdyhAxKihrqtTtEkYC4Y3u412KCPLGSD93V",
    "B62qj3rpYkGM1T3VN6JDAJs9NccHCRQDYMcQ6UCBc81ff5HXTDjU44d",
    "B62qp2kks3r14P8GWkR2ieT18JobwnmrBFGEoqy3dAReiyM8aDp4be7",
    "B62qpW1SYPcp7TcHJYL6egnN9qzvNtQL5XGyiM8S6UsHvxCYzhhFPjz",
    "B62qospDjUj43x2yMKiNehojWWRUsE1wpdUDVpfxH8V3n5Y1QgJKFfw",
    "B62qj5L8U8A8gexpHLWHxBdfjKuWb8HMguVPecQ5FGqgZAwBAKHvhEy",
    "B62qnt5WShcbVVnVqQqWjkyMJdxMwLq4QbRbgMjoi5nmvQw7dZLRtpx",
    "B62qrGUxqRWn9A8PEJschgLZuS5S1GJiairh65mgTapaK58nkTKHUs8",
    "B62qkS7hmMkzmNDjeCUKyAMZSw1c98MxszZPA7WnvBuh7Pq66ztiwdt",
    "B62qjGWerE9MPNk7E2jEJe9Ex5GxkNR9JCc5mhFeJdGFaNDHnMdGQJQ",
    "B62qpp2DLkLxwFn1QZdkEWgiRFMYnkgh6cj5AJC5pqCYiALh8BmiYJ8",
    "B62qqALaAoEnaJPSNmQaDkUwFGiKwZo4zRK4Ay5eSMxAMVhNxwr2KeM",
    "B62qospDjUj43x2yMKiNehojWWRUsE1wpdUDVpfxH8V3n5Y1QgJKFfw",
    "B62qr3epzHUrxrdminUN4Hzuinuc7aBDAFSR94mPmmxVsbuFpUvDDq6",
    "B62qrJurUKtcqdhQu1XtJJfSH7rR1xrEtSWPQQcFwBJBwVcsFSyVSM3",
  ];

  const invalidAddresses = [
    "", // Empty address
    null, // Null address
    undefined, // Undefined address
    "123", // Too short
    "B61qiVhtBtqakq8sNTHdCTXn6tETSK6gtsmNHRn1WdLqjGLpsHbw1xc", // Incorrect prefix
    "B62q!@#$%^&*()_+{}|:<>?`~", // Invalid characters
    "B62qj5L8U8A8gexpHLWHxBdfjKuWb8HMguVPecQ5FGqgZAwBAKHvhE", // Too short
    "B62qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq", // Too long
    " B62qiVhtBtqakq8sNTHdCTXn6tETSK6gtsmNHRn1WdLqjGLpsHbw1xc", // Leading whitespace
    "B62qiVhtBtqakq8sNTHdCTXn6tETSK6gtsmNHRn1WdLqjGLpsHbw1xc ", // Trailing whitespace
    "B62qiVhtBtqakq8sNTHdC TXn6tETSK6gtsmNHRn1WdLqjGLpsHbw1xc", // Internal whitespace
    "C62qiVhtBtqakq8sNTHdCTXn6tETSK6gtsmNHRn1WdLqjGLpsHbw1xc", // Incorrect prefix
  ];

  it("should return true for valid address", () => {
    for (const address of validAddresses) {
      expect(isValidAddress(address)).toBe(true);
    }
  });

  it("should return false for invalid address", () => {
    for (const address of invalidAddresses) {
      expect(isValidAddress(address as string)).toBe(false);
    }
  });
});

import { PayCardCashbackResponseSchema } from "./schema";
import { mockPayCardCashback } from "./cardCashback.mock";

describe("the mocked cashback response", () => {
  it("answers as the provider is parsed, or the query would reject it", () => {
    expect(PayCardCashbackResponseSchema.safeParse(mockPayCardCashback()).success).toBe(true);
  });
});

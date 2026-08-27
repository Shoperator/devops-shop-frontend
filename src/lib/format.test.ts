import { formatAmount, formatDateTime, shortId } from "./format";

describe("formatAmount", () => {
  it("always shows two decimals, the way a price is written", () => {
    expect(formatAmount(12)).toBe("12.00 USDT");
    expect(formatAmount(12.5)).toBe("12.50 USDT");
  });

  it("keeps the currency the order was placed in", () => {
    expect(formatAmount(1.5, "ETH")).toBe("1.50 ETH");
  });

  it("formats zero as a real amount, not as an empty cell", () => {
    expect(formatAmount(0)).toBe("0.00 USDT");
  });
});

describe("formatDateTime", () => {
  it("renders a timestamp the backend sent", () => {
    // The exact wording is locale data; what matters is that it is readable
    // and stable rather than an ISO string.
    const formatted = formatDateTime("2026-01-02T15:04:05.000Z");

    expect(formatted).toContain("2026");
    expect(formatted).not.toContain("T");
  });

  it("does not blow up on a value that is not a date", () => {
    expect(formatDateTime("not-a-date")).toBe("—");
  });
});

describe("shortId", () => {
  it("keeps the first block of a uuid", () => {
    expect(shortId("b3f1c0de-0000-4000-8000-000000000002")).toBe("b3f1c0de");
  });
});

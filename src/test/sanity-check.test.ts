import { describe, it, expect } from "vitest";
import { runSanityCheck } from "@/lib/sanityCheck";

describe("WPM Sanity Check Guardrail", () => {
  it("flags WPM > 300 as high_interference", () => {
    const r = runSanityCheck(350, 90);
    expect(r.flag).toBe("high_interference");
    expect(r.reason).not.toBeNull();
  });

  it("flags WPM > 150 as high_interference", () => {
    const r = runSanityCheck(180, 85);
    expect(r.flag).toBe("high_interference");
    expect(r.reason).not.toBeNull();
  });

  it("flags WPM > 40 with accuracy < 20% as high_interference", () => {
    const r = runSanityCheck(65, 15);
    expect(r.flag).toBe("high_interference");
    expect(r.reason).not.toBeNull();
  });

  it("passes normal 1st grade reading (90 WPM, 80%)", () => {
    const r = runSanityCheck(90, 80);
    expect(r.flag).toBe("valid");
    expect(r.wpm).toBe(90);
    expect(r.accuracy).toBe(80);
  });

  it("passes slow reader (25 WPM, 10% accuracy) — low WPM exempts accuracy rule", () => {
    const r = runSanityCheck(25, 10);
    expect(r.flag).toBe("valid");
  });

  it("passes exactly 150 WPM", () => {
    const r = runSanityCheck(150, 95);
    expect(r.flag).toBe("valid");
  });

  it("flags exactly 151 WPM", () => {
    const r = runSanityCheck(151, 95);
    expect(r.flag).toBe("high_interference");
  });

  it("preserves scores when flagged (the flag marks interference; values are kept)", () => {
    const r = runSanityCheck(200, 50);
    expect(r.rawWpm).toBe(200);
    expect(r.rawAccuracy).toBe(50);
    expect(r.wpm).toBe(200);
    expect(r.accuracy).toBe(50);
  });
});

import { describe, it, expect } from "vitest";
import { extractVideoId, approxCount, cleanTranscriptLines, textOf } from "../../src/util/parse.js";
import { TubeScoutError } from "../../src/util/retry.js";

describe("extractVideoId", () => {
  it("accepts bare 11-char IDs", () => {
    expect(extractVideoId("WE5uCp5cS_g")).toBe("WE5uCp5cS_g");
    expect(extractVideoId("5-G9WHwQMwQ")).toBe("5-G9WHwQMwQ");
  });
  it("parses watch URLs", () => {
    expect(extractVideoId("https://www.youtube.com/watch?v=WE5uCp5cS_g")).toBe("WE5uCp5cS_g");
    expect(extractVideoId("https://www.youtube.com/watch?v=y-eBAr1uRDQ&pp=ugUEEgJlbg%3D%3D")).toBe("y-eBAr1uRDQ");
  });
  it("parses youtu.be, shorts, embed, live URLs", () => {
    expect(extractVideoId("https://youtu.be/WE5uCp5cS_g")).toBe("WE5uCp5cS_g");
    expect(extractVideoId("https://www.youtube.com/shorts/WE5uCp5cS_g")).toBe("WE5uCp5cS_g");
    expect(extractVideoId("https://www.youtube.com/embed/WE5uCp5cS_g")).toBe("WE5uCp5cS_g");
    expect(extractVideoId("https://www.youtube.com/live/WE5uCp5cS_g")).toBe("WE5uCp5cS_g");
  });
  it("rejects garbage with a helpful error", () => {
    expect(() => extractVideoId("not a video")).toThrow(TubeScoutError);
    expect(() => extractVideoId("https://www.youtube.com/@starterstory")).toThrow(TubeScoutError);
  });
});

describe("approxCount", () => {
  it("parses exact and abbreviated counts", () => {
    expect(approxCount("1,234,567 views")).toBe(1234567);
    expect(approxCount("30K views")).toBe(30000);
    expect(approxCount("1.2M views")).toBe(1200000);
    expect(approxCount("3B views")).toBe(3000000000);
  });
  it("returns null for non-numeric strings", () => {
    expect(approxCount("no views")).toBeNull();
  });
});

describe("cleanTranscriptLines", () => {
  it("collapses whitespace and drops consecutive duplicates", () => {
    expect(cleanTranscriptLines(["hello  world", "hello world", "next line", "", "  "])).toBe("hello world next line");
  });
});

describe("textOf", () => {
  it("unwraps Text-like nodes and passes strings through", () => {
    expect(textOf("plain")).toBe("plain");
    expect(textOf({ text: "wrapped" })).toBe("wrapped");
    expect(textOf(42)).toBe("42");
    expect(textOf(null)).toBe("");
    expect(textOf({ foo: "bar" })).toBe("");
  });
});

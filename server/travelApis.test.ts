import { afterEach, describe, expect, it, vi } from "vitest";
import { searchCities, searchUnsplash } from "./travelApis";

describe("travel API helpers", () => {
  afterEach(() => vi.restoreAllMocks());

  it("maps GeoDB city results", async () => {
    process.env.GEODB_API_KEY = "test-key"; process.env.GEODB_API_HOST = "example.test";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: [{ id: 1, city: "Kyoto", country: "Japan" }] }), { status: 200 })));
    const result = await searchCities("Kyoto");
    expect(result[0].city).toBe("Kyoto");
    const request = vi.mocked(fetch).mock.calls[0];
    expect(String(request[0])).toContain("namePrefix=Kyoto");
    expect((request[1]?.headers as Record<string, string>)["X-RapidAPI-Key"]).toBe("test-key");
  });

  it("maps Unsplash attribution fields", async () => {
    process.env.UNSPLASH_ACCESS_KEY = "test-key";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ results: [{ urls: { regular: "https://img.test/1" }, user: { name: "A Photographer", links: { html: "https://unsplash.com/a" } } }] }), { status: 200 })));
    const result = await searchUnsplash("Lisbon");
    expect(result).toEqual([{ url: "https://img.test/1", photographer: "A Photographer", profileUrl: "https://unsplash.com/a" }]);
  });
});

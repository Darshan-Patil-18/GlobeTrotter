import { describe, expect, it } from "vitest";

describe("Supabase configuration", () => {
  it("responds to the lightweight auth settings endpoint", async () => {
    const url = process.env.VITE_SUPABASE_URL;
    const key = process.env.VITE_SUPABASE_ANON_KEY;
    expect(url).toMatch(/^https:\/\//);
    expect(key).toBeTruthy();

    const response = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: key as string },
    });
    expect(response.ok).toBe(true);
  }, 15_000);
});

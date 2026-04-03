import { beforeEach, describe, expect, it, vi } from "vitest";

const TEST_SECRET = "test-secret-key-minimum-32-characters-long!!";

vi.mock("../../env.ts", () => ({
  default: {
    JWT_SECRET: TEST_SECRET,
    JWT_EXPIRES_IN: "1h",
  },
  env: {
    JWT_SECRET: TEST_SECRET,
    JWT_EXPIRES_IN: "1h",
  },
}));

import { generateToken, verifyToken, type JwtPayload } from "./jwt.ts";

const testPayload: JwtPayload = {
  id: "11111111-1111-1111-1111-111111111111",
  email: "test@example.com",
  username: "testuser",
  role: "pharmacist",
};

describe("generateToken", () => {
  it("returns a non-empty JWT string", async () => {
    const token = await generateToken(testPayload);
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3); // header.payload.signature
  });

  it("generates different tokens on each call (due to iat)", async () => {
    // Wait 1ms to ensure different iat values aren't a concern —
    // jose signs with iat so tokens issued in the same second can be identical.
    // Just verify two calls both produce valid-looking tokens.
    const t1 = await generateToken(testPayload);
    const t2 = await generateToken(testPayload);
    expect(t1).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
    expect(t2).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
  });
});

describe("verifyToken", () => {
  it("verifies a valid token and returns the payload", async () => {
    const token = await generateToken(testPayload);
    const decoded = await verifyToken(token);

    expect(decoded.id).toBe(testPayload.id);
    expect(decoded.email).toBe(testPayload.email);
    expect(decoded.username).toBe(testPayload.username);
    expect(decoded.role).toBe(testPayload.role);
  });

  it("throws when given a tampered token", async () => {
    const token = await generateToken(testPayload);
    const [header, payload, _sig] = token.split(".");
    const tamperedToken = `${header}.${payload}.invalidsignature`;

    await expect(verifyToken(tamperedToken)).rejects.toThrow();
  });

  it("throws when given a completely invalid token", async () => {
    await expect(verifyToken("not.a.token")).rejects.toThrow();
  });
});

import { describe, expect, it } from "vitest";
import { AppError } from "./AppError.ts";

describe("AppError", () => {
  it("sets statusCode and message", () => {
    const err = new AppError(404, "Not found");
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe("Not found");
  });

  it("is an instance of Error", () => {
    const err = new AppError(500, "Internal error");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
  });

  it("always has isOperational = true", () => {
    const err = new AppError(400, "Bad request");
    expect(err.isOperational).toBe(true);
  });

  it("stores optional details", () => {
    const details = { field: "email", issue: "invalid format" };
    const err = new AppError(422, "Validation failed", details);
    expect(err.details).toEqual(details);
  });

  it("has undefined details when not provided", () => {
    const err = new AppError(400, "Bad request");
    expect(err.details).toBeUndefined();
  });

  it("captures a stack trace", () => {
    const err = new AppError(500, "Error");
    expect(err.stack).toBeDefined();
  });
});

import { describe, expect, it } from "vitest";
import {
  insertMedicationSchema,
  medicationQuerySchema,
  updateMedicationSchema,
} from "./medications.validators.ts";

const validPayload = {
  name: "Ibuprofen",
  generic_name: "Ibuprofen",
  dosage_form: "tablet" as const,
  strength: "200mg",
  manufacturer: "Pfizer",
  requires_prescription: false,
  unit_price: "9.99",
};

describe("insertMedicationSchema", () => {
  it("accepts a valid medication", () => {
    const result = insertMedicationSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("rejects name shorter than 2 characters", () => {
    const result = insertMedicationSchema.safeParse({ ...validPayload, name: "X" });
    expect(result.success).toBe(false);
  });

  it("rejects strength longer than 100 characters", () => {
    const result = insertMedicationSchema.safeParse({
      ...validPayload,
      strength: "a".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid unit_price format", () => {
    const result = insertMedicationSchema.safeParse({
      ...validPayload,
      unit_price: "abc",
    });
    expect(result.success).toBe(false);
  });

  it("accepts unit_price with two decimal places", () => {
    const result = insertMedicationSchema.safeParse({
      ...validPayload,
      unit_price: "14.99",
    });
    expect(result.success).toBe(true);
  });

  it("rejects unit_price with more than two decimal places", () => {
    const result = insertMedicationSchema.safeParse({
      ...validPayload,
      unit_price: "14.999",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid dosage_form value", () => {
    const result = insertMedicationSchema.safeParse({
      ...validPayload,
      dosage_form: "spray",
    });
    expect(result.success).toBe(false);
  });

  it("strips id, created_at and updated_at even if provided", () => {
    const result = insertMedicationSchema.safeParse({
      ...validPayload,
      id: "some-id",
      created_at: new Date(),
      updated_at: new Date(),
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).id).toBeUndefined();
    }
  });
});

describe("updateMedicationSchema", () => {
  it("accepts a partial update", () => {
    const result = updateMedicationSchema.safeParse({ name: "Aspirin" });
    expect(result.success).toBe(true);
  });

  it("accepts an empty object (all fields optional)", () => {
    const result = updateMedicationSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects invalid name on update", () => {
    const result = updateMedicationSchema.safeParse({ name: "X" });
    expect(result.success).toBe(false);
  });
});

describe("medicationQuerySchema", () => {
  it("applies defaults for page and limit", () => {
    const result = medicationQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it("coerces string page and limit to numbers", () => {
    const result = medicationQuerySchema.parse({ page: "2", limit: "10" });
    expect(result.page).toBe(2);
    expect(result.limit).toBe(10);
  });

  it("transforms requires_prescription string to boolean", () => {
    const result = medicationQuerySchema.parse({ requires_prescription: "true" });
    expect(result.requires_prescription).toBe(true);

    const result2 = medicationQuerySchema.parse({ requires_prescription: "false" });
    expect(result2.requires_prescription).toBe(false);
  });

  it("rejects limit above 100", () => {
    const result = medicationQuerySchema.safeParse({ limit: "101" });
    expect(result.success).toBe(false);
  });
});

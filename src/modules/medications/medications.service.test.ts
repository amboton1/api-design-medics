import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../../lib/AppError.ts";
import {
  createMedication,
  deleteMedication,
  getMedicationById,
  getMedications,
  updateMedication,
} from "./medications.service.ts";

vi.mock("../../db/index.ts");

import { db } from "../../db/index.ts";

// Creates a chainable thenable mock for SELECT queries.
// Any terminal point in the chain (.where, .offset, etc.) will resolve to `result`.
function makeSelectChain(result: unknown) {
  const chain: Record<string, unknown> & { then: Function } = {
    then: (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
  };
  for (const method of ["from", "where", "limit", "offset", "innerJoin"]) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }
  return chain;
}

// Creates a chainable mock for INSERT/UPDATE mutations.
function makeMutationChain(returnedRows: unknown[]) {
  const chain: Record<string, unknown> = {};
  chain.values = vi.fn().mockReturnValue(chain);
  chain.set = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockReturnValue(chain);
  chain.returning = vi.fn().mockResolvedValue(returnedRows);
  return chain;
}

const mockMedication = {
  id: "11111111-1111-1111-1111-111111111111",
  name: "Ibuprofen",
  generic_name: "Ibuprofen",
  dosage_form: "tablet",
  strength: "200mg",
  manufacturer: "Pfizer",
  requires_prescription: false,
  description: null,
  active_ingredient: null,
  unit_price: "9.99",
  is_active: true,
  created_at: new Date("2024-01-01"),
  updated_at: new Date("2024-01-01"),
};

const mockDb = vi.mocked(db);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getMedicationById", () => {
  it("returns the medication when found", async () => {
    mockDb.select = vi.fn().mockReturnValue(makeSelectChain([mockMedication]));

    const result = await getMedicationById(mockMedication.id);
    expect(result).toEqual(mockMedication);
  });

  it("throws AppError 404 when not found", async () => {
    mockDb.select = vi.fn().mockReturnValue(makeSelectChain([]));

    await expect(getMedicationById("non-existent-id")).rejects.toThrow(AppError);
    await expect(getMedicationById("non-existent-id")).rejects.toMatchObject({
      statusCode: 404,
      message: "Medication not found",
    });
  });
});

describe("getMedications", () => {
  it("returns paginated data with correct pagination meta", async () => {
    const mockRows = [mockMedication];
    mockDb.select = vi
      .fn()
      .mockReturnValueOnce(makeSelectChain(mockRows))
      .mockReturnValueOnce(makeSelectChain([{ count: 1 }]));

    const result = await getMedications({
      page: 1,
      limit: 20,
    });

    expect(result.data).toEqual(mockRows);
    expect(result.pagination).toEqual({
      total: 1,
      page: 1,
      limit: 20,
      pages: 1,
    });
  });

  it("computes pages correctly for multiple pages", async () => {
    mockDb.select = vi
      .fn()
      .mockReturnValueOnce(makeSelectChain([mockMedication]))
      .mockReturnValueOnce(makeSelectChain([{ count: 45 }]));

    const result = await getMedications({ page: 1, limit: 20 });
    expect(result.pagination.pages).toBe(3); // ceil(45/20)
  });
});

describe("createMedication", () => {
  it("inserts and returns the new medication", async () => {
    const mutation = makeMutationChain([mockMedication]);
    mockDb.insert = vi.fn().mockReturnValue(mutation);

    const input = {
      name: "Ibuprofen",
      generic_name: "Ibuprofen",
      dosage_form: "tablet" as const,
      strength: "200mg",
      manufacturer: "Pfizer",
      requires_prescription: false,
      unit_price: "9.99",
    };

    const result = await createMedication(input);
    expect(result).toEqual(mockMedication);
    expect(mockDb.insert).toHaveBeenCalledOnce();
  });
});

describe("updateMedication", () => {
  it("updates and returns the medication", async () => {
    const updated = { ...mockMedication, name: "Ibuprofen 400mg" };
    // First call: getMedicationById (select), second: update mutation
    mockDb.select = vi.fn().mockReturnValue(makeSelectChain([mockMedication]));
    const mutation = makeMutationChain([updated]);
    mockDb.update = vi.fn().mockReturnValue(mutation);

    const result = await updateMedication(mockMedication.id, { name: "Ibuprofen 400mg" });
    expect(result).toEqual(updated);
  });

  it("throws 404 when medication does not exist", async () => {
    mockDb.select = vi.fn().mockReturnValue(makeSelectChain([]));

    await expect(
      updateMedication("non-existent-id", { name: "Test" }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe("deleteMedication", () => {
  it("soft-deletes by setting is_active to false", async () => {
    const deactivated = { ...mockMedication, is_active: false };
    mockDb.select = vi.fn().mockReturnValue(makeSelectChain([mockMedication]));
    const mutation = makeMutationChain([deactivated]);
    mockDb.update = vi.fn().mockReturnValue(mutation);

    const result = await deleteMedication(mockMedication.id);
    expect(result.is_active).toBe(false);

    // Verify is_active: false was passed to .set()
    expect(vi.mocked(mutation.set as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(
      expect.objectContaining({ is_active: false }),
    );
  });

  it("throws 404 when medication does not exist", async () => {
    mockDb.select = vi.fn().mockReturnValue(makeSelectChain([]));

    await expect(deleteMedication("non-existent-id")).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

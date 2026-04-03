import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../../lib/AppError.ts";
import {
  createTransaction,
  getInventoryByMedicationId,
} from "./inventory.service.ts";

vi.mock("../../db/index.ts");

import { db } from "../../db/index.ts";

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

function makeMutationChain(returnedRows: unknown[]) {
  const chain: Record<string, unknown> = {};
  chain.values = vi.fn().mockReturnValue(chain);
  chain.set = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockReturnValue(chain);
  chain.returning = vi.fn().mockResolvedValue(returnedRows);
  return chain;
}

const mockInventory = {
  id: "aaaa-bbbb-cccc-dddd",
  medication_id: "11111111-1111-1111-1111-111111111111",
  quantity_on_hand: 100,
  reorder_threshold: 10,
  reorder_quantity: 50,
  unit_of_measure: "tablets",
  updated_at: new Date("2024-01-01"),
};

const mockDb = vi.mocked(db);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getInventoryByMedicationId", () => {
  it("returns the inventory record when found", async () => {
    mockDb.select = vi.fn().mockReturnValue(makeSelectChain([mockInventory]));

    const result = await getInventoryByMedicationId(mockInventory.medication_id);
    expect(result).toEqual(mockInventory);
  });

  it("throws AppError 404 when inventory record does not exist", async () => {
    mockDb.select = vi.fn().mockReturnValue(makeSelectChain([]));

    await expect(
      getInventoryByMedicationId("non-existent-id"),
    ).rejects.toMatchObject({
      statusCode: 404,
      message: "Inventory record not found",
    });
  });
});

describe("createTransaction", () => {
  it("throws AppError 400 when quantity_delta would make stock negative", async () => {
    // quantity_on_hand = 100, delta = -150 → quantity_after = -50 (invalid)
    mockDb.select = vi
      .fn()
      .mockReturnValue(makeSelectChain([{ ...mockInventory, quantity_on_hand: 100 }]));

    await expect(
      createTransaction(mockInventory.medication_id, {
        quantity_delta: -150,
        transaction_type: "sale",
        notes: "Test sale",
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Insufficient stock",
    });
  });

  it("throws AppError 400 when stock is zero and delta is negative", async () => {
    mockDb.select = vi
      .fn()
      .mockReturnValue(makeSelectChain([{ ...mockInventory, quantity_on_hand: 0 }]));

    await expect(
      createTransaction(mockInventory.medication_id, {
        quantity_delta: -1,
        transaction_type: "sale",
        notes: null,
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Insufficient stock",
    });
  });

  it("proceeds when quantity_delta reduces stock to exactly zero", async () => {
    const mockTxInsert = makeMutationChain([
      {
        id: "txn-1",
        medication_id: mockInventory.medication_id,
        quantity_before: 50,
        quantity_after: 0,
        quantity_delta: -50,
        transaction_type: "sale",
        notes: null,
        created_at: new Date(),
      },
    ]);
    const mockTxUpdate = makeMutationChain([{ ...mockInventory, quantity_on_hand: 0 }]);

    const txMock = {
      insert: vi.fn().mockReturnValue(mockTxInsert),
      update: vi.fn().mockReturnValue(mockTxUpdate),
    };

    mockDb.select = vi
      .fn()
      .mockReturnValue(makeSelectChain([{ ...mockInventory, quantity_on_hand: 50 }]));
    mockDb.transaction = vi.fn().mockImplementation(async (fn: Function) => fn(txMock));

    const result = await createTransaction(mockInventory.medication_id, {
      quantity_delta: -50,
      transaction_type: "sale",
      notes: null,
    });

    expect(result.quantity_after).toBe(0);
    expect(result).toMatchObject({ quantity_before: 50, quantity_after: 0 });
  });

  it("allows positive delta (restocking)", async () => {
    const mockTxInsert = makeMutationChain([
      {
        id: "txn-2",
        medication_id: mockInventory.medication_id,
        quantity_before: 100,
        quantity_after: 200,
        quantity_delta: 100,
        transaction_type: "restock",
        notes: "Restock order",
        created_at: new Date(),
      },
    ]);
    const mockTxUpdate = makeMutationChain([{ ...mockInventory, quantity_on_hand: 200 }]);

    const txMock = {
      insert: vi.fn().mockReturnValue(mockTxInsert),
      update: vi.fn().mockReturnValue(mockTxUpdate),
    };

    mockDb.select = vi
      .fn()
      .mockReturnValue(makeSelectChain([{ ...mockInventory, quantity_on_hand: 100 }]));
    mockDb.transaction = vi.fn().mockImplementation(async (fn: Function) => fn(txMock));

    const result = await createTransaction(mockInventory.medication_id, {
      quantity_delta: 100,
      transaction_type: "restock",
      notes: "Restock order",
    });

    expect(result.quantity_after).toBe(200);
  });
});

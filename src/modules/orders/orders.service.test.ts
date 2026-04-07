import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../../lib/AppError.ts";
import {
  addOrderItem,
  cancelOrder,
  createOrder,
  createPharmacy,
  getOrderById,
  getPharmacyById,
  removeOrderItem,
  updateOrder,
} from "./orders.service.ts";

vi.mock("../../db/index.ts");

import { db } from "../../db/index.ts";

function makeSelectChain(result: unknown) {
  const chain: Record<string, unknown> & { then: Function } = {
    then: (resolve: Function, reject: Function) =>
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

function makeDeleteChain() {
  return {
    where: vi.fn().mockResolvedValue(undefined),
  };
}

const mockDb = vi.mocked(db);

const PHARMACY_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const ORDER_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const ITEM_ID = "cccccccc-cccc-cccc-cccc-cccccccccccc";
const MED_ID = "dddddddd-dddd-dddd-dddd-dddddddddddd";

const mockPharmacy = {
  id: PHARMACY_ID,
  name: "City Pharmacy",
  license_number: "LIC-001",
  address: "123 Main St",
  contact_phone: "555-1234",
  contact_email: "city@pharmacy.com",
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
};

const mockOrder = {
  id: ORDER_ID,
  order_number: "ORD-001",
  pharmacy_id: PHARMACY_ID,
  status: "draft" as const,
  total_amount: "50.00",
  notes: null,
  fulfilled_at: null,
  created_at: new Date(),
  updated_at: new Date(),
};

const mockOrderItem = {
  id: ITEM_ID,
  order_id: ORDER_ID,
  medication_id: MED_ID,
  medication_name: "Ibuprofen",
  quantity_ordered: 10,
  quantity_fulfilled: 0,
  unit_price: "5.00",
  line_total: "50.00",
  created_at: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Pharmacy ─────────────────────────────────────────────────────────────────

describe("getPharmacyById", () => {
  it("returns the pharmacy when found", async () => {
    mockDb.select = vi.fn().mockReturnValue(makeSelectChain([mockPharmacy]));
    const result = await getPharmacyById(PHARMACY_ID);
    expect(result).toEqual(mockPharmacy);
  });

  it("throws AppError 404 when not found", async () => {
    mockDb.select = vi.fn().mockReturnValue(makeSelectChain([]));
    await expect(getPharmacyById(PHARMACY_ID)).rejects.toThrow(AppError);
    await expect(getPharmacyById(PHARMACY_ID)).rejects.toMatchObject({
      statusCode: 404,
      message: "Pharmacy not found",
    });
  });
});

describe("createPharmacy", () => {
  it("inserts and returns the new pharmacy", async () => {
    mockDb.insert = vi.fn().mockReturnValue(makeMutationChain([mockPharmacy]));
    const result = await createPharmacy({
      name: "City Pharmacy",
      license_number: "LIC-001",
      address: "123 Main St",
    });
    expect(result).toEqual(mockPharmacy);
    expect(mockDb.insert).toHaveBeenCalledOnce();
  });
});

// ─── Orders ───────────────────────────────────────────────────────────────────

describe("getOrderById", () => {
  it("returns the order with items when found", async () => {
    mockDb.select = vi
      .fn()
      .mockReturnValueOnce(makeSelectChain([mockOrder]))
      .mockReturnValueOnce(makeSelectChain([mockOrderItem]));

    const result = await getOrderById(ORDER_ID);
    expect(result).toEqual({ ...mockOrder, items: [mockOrderItem] });
  });

  it("throws AppError 404 when not found", async () => {
    mockDb.select = vi.fn().mockReturnValue(makeSelectChain([]));
    await expect(getOrderById(ORDER_ID)).rejects.toThrow(AppError);
    await expect(getOrderById(ORDER_ID)).rejects.toMatchObject({
      statusCode: 404,
      message: "Order not found",
    });
  });
});

describe("createOrder", () => {
  it("creates order with items in a transaction", async () => {
    const mockTx = {
      insert: vi
        .fn()
        .mockReturnValueOnce(makeMutationChain([mockOrder]))
        .mockReturnValueOnce(makeMutationChain([mockOrderItem])),
    };

    mockDb.transaction = vi.fn().mockImplementation(async (callback) => {
      return callback(mockTx);
    });

    const result = await createOrder({
      order_number: "ORD-001",
      pharmacy_id: PHARMACY_ID,
      items: [
        {
          medication_id: MED_ID,
          quantity_ordered: 10,
          unit_price: "5.00",
        },
      ],
    });

    expect(result).toEqual({ ...mockOrder, items: [mockOrderItem] });
    expect(mockDb.transaction).toHaveBeenCalledOnce();
    expect(mockTx.insert).toHaveBeenCalledTimes(2);
  });
});

describe("updateOrder", () => {
  it("updates and returns the order", async () => {
    const updated = { ...mockOrder, status: "submitted" as const };
    mockDb.select = vi.fn().mockReturnValue(makeSelectChain([mockOrder]));
    mockDb.update = vi.fn().mockReturnValue(makeMutationChain([updated]));

    const result = await updateOrder(ORDER_ID, { status: "submitted" });
    expect(result).toEqual(updated);
    expect(mockDb.update).toHaveBeenCalledOnce();
  });

  it("sets fulfilled_at when status is fulfilled", async () => {
    const fulfilled = {
      ...mockOrder,
      status: "fulfilled" as const,
      fulfilled_at: new Date(),
    };
    mockDb.select = vi.fn().mockReturnValue(makeSelectChain([mockOrder]));
    const mutation = makeMutationChain([fulfilled]);
    mockDb.update = vi.fn().mockReturnValue(mutation);

    await updateOrder(ORDER_ID, { status: "fulfilled" });

    const setCall = vi.mocked(mutation.set as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as Record<string, unknown>;
    expect(setCall.fulfilled_at).toBeInstanceOf(Date);
  });

  it("throws AppError 404 when order not found", async () => {
    mockDb.select = vi.fn().mockReturnValue(makeSelectChain([]));
    await expect(
      updateOrder(ORDER_ID, { status: "submitted" }),
    ).rejects.toThrow(AppError);
    await expect(
      updateOrder(ORDER_ID, { status: "submitted" }),
    ).rejects.toMatchObject({
      statusCode: 404,
      message: "Order not found",
    });
  });
});

describe("cancelOrder", () => {
  it("cancels a draft order", async () => {
    const cancelled = { ...mockOrder, status: "cancelled" as const };
    mockDb.select = vi.fn().mockReturnValue(makeSelectChain([mockOrder]));
    mockDb.update = vi.fn().mockReturnValue(makeMutationChain([cancelled]));

    const result = await cancelOrder(ORDER_ID);
    expect(result.status).toBe("cancelled");
  });

  it("throws 400 when order is already cancelled", async () => {
    const alreadyCancelled = { ...mockOrder, status: "cancelled" as const };
    mockDb.select = vi
      .fn()
      .mockReturnValue(makeSelectChain([alreadyCancelled]));

    await expect(cancelOrder(ORDER_ID)).rejects.toThrow(AppError);
    await expect(cancelOrder(ORDER_ID)).rejects.toMatchObject({
      statusCode: 400,
      message: "Order is already cancelled",
    });
  });

  it("throws 400 when order is fulfilled", async () => {
    const fulfilled = { ...mockOrder, status: "fulfilled" as const };
    mockDb.select = vi.fn().mockReturnValue(makeSelectChain([fulfilled]));

    await expect(cancelOrder(ORDER_ID)).rejects.toThrow(AppError);
    await expect(cancelOrder(ORDER_ID)).rejects.toMatchObject({
      statusCode: 400,
      message: "Cannot cancel a fulfilled order",
    });
  });
});

// ─── Order Items ──────────────────────────────────────────────────────────────

describe("addOrderItem", () => {
  it("throws 400 when order is not a draft", async () => {
    const submitted = { ...mockOrder, status: "submitted" as const };
    mockDb.select = vi.fn().mockReturnValue(makeSelectChain([submitted]));

    await expect(
      addOrderItem(ORDER_ID, {
        medication_id: MED_ID,
        quantity_ordered: 5,
        unit_price: "10.00",
      }),
    ).rejects.toThrow(AppError);
    await expect(
      addOrderItem(ORDER_ID, {
        medication_id: MED_ID,
        quantity_ordered: 5,
        unit_price: "10.00",
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Items can only be added to draft orders",
    });
  });

  it("inserts item and updates order total in a transaction", async () => {
    mockDb.select = vi.fn().mockReturnValue(makeSelectChain([mockOrder]));

    const mockTx = {
      insert: vi.fn().mockReturnValue(makeMutationChain([mockOrderItem])),
      select: vi.fn().mockReturnValue(makeSelectChain([{ total: "50.00" }])),
      update: vi.fn().mockReturnValue(makeMutationChain([])),
    };

    mockDb.transaction = vi.fn().mockImplementation(async (callback) => {
      return callback(mockTx);
    });

    const result = await addOrderItem(ORDER_ID, {
      medication_id: MED_ID,
      quantity_ordered: 10,
      unit_price: "5.00",
    });

    expect(result).toEqual(mockOrderItem);
    expect(mockTx.insert).toHaveBeenCalledOnce();
    expect(mockTx.update).toHaveBeenCalledOnce();
  });
});

describe("removeOrderItem", () => {
  it("throws 400 when order is not a draft", async () => {
    const submitted = { ...mockOrder, status: "submitted" as const };
    mockDb.select = vi.fn().mockReturnValue(makeSelectChain([submitted]));

    await expect(removeOrderItem(ORDER_ID, ITEM_ID)).rejects.toThrow(AppError);
    await expect(removeOrderItem(ORDER_ID, ITEM_ID)).rejects.toMatchObject({
      statusCode: 400,
      message: "Items can only be removed from draft orders",
    });
  });

  it("throws 404 when item not found on order", async () => {
    mockDb.select = vi
      .fn()
      .mockReturnValueOnce(makeSelectChain([mockOrder]))
      .mockReturnValueOnce(makeSelectChain([]))
      .mockReturnValueOnce(makeSelectChain([mockOrder]))
      .mockReturnValueOnce(makeSelectChain([]));

    await expect(removeOrderItem(ORDER_ID, ITEM_ID)).rejects.toThrow(AppError);
    await expect(removeOrderItem(ORDER_ID, ITEM_ID)).rejects.toMatchObject({
      statusCode: 404,
      message: "Order item not found",
    });
  });

  it("deletes item and recalculates order total in a transaction", async () => {
    mockDb.select = vi
      .fn()
      .mockReturnValueOnce(makeSelectChain([mockOrder]))
      .mockReturnValueOnce(makeSelectChain([mockOrderItem]));

    const mockTx = {
      delete: vi.fn().mockReturnValue(makeDeleteChain()),
      select: vi.fn().mockReturnValue(makeSelectChain([{ total: "0.00" }])),
      update: vi.fn().mockReturnValue(makeMutationChain([])),
    };

    mockDb.transaction = vi.fn().mockImplementation(async (callback) => {
      return callback(mockTx);
    });

    const result = await removeOrderItem(ORDER_ID, ITEM_ID);
    expect(result).toEqual(mockOrderItem);
    expect(mockTx.delete).toHaveBeenCalledOnce();
    expect(mockTx.update).toHaveBeenCalledOnce();
  });
});

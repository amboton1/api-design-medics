import { and, eq, ilike, type SQL, sql } from "drizzle-orm";
import { db } from "../../db/index.ts";
import {
  medications,
  order_items,
  orders,
  pharmacies,
} from "../../db/schema/index.ts";
import { AppError } from "../../lib/AppError.ts";
import type {
  AddOrderItem,
  InsertOrder,
  InsertPharmacy,
  OrderQuery,
  PharmacyQuery,
  UpdateOrder,
  UpdateOrderItem,
  UpdatePharmacy,
} from "./orders.validators.ts";

export async function getPharmacies(query: PharmacyQuery) {
  const { page, limit, search, is_active } = query;
  const offset = (page - 1) * limit;

  const filters: SQL[] = [];
  if (search) filters.push(ilike(pharmacies.name, `%${search}%`));
  if (is_active !== undefined)
    filters.push(eq(pharmacies.is_active, is_active));

  const where = filters.length > 0 ? and(...filters) : undefined;

  const [rows, [{ count }]] = await Promise.all([
    db.select().from(pharmacies).where(where).limit(limit).offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(pharmacies)
      .where(where),
  ]);

  return {
    data: rows,
    pagination: { total: count, page, limit, pages: Math.ceil(count / limit) },
  };
}

export async function getPharmacyById(id: string) {
  const [row] = await db.select().from(pharmacies).where(eq(pharmacies.id, id));
  if (!row) throw new AppError(404, "Pharmacy not found");
  return row;
}

export async function createPharmacy(data: InsertPharmacy) {
  const [row] = await db.insert(pharmacies).values(data).returning();
  return row;
}

export async function updatePharmacy(id: string, data: UpdatePharmacy) {
  await getPharmacyById(id);
  const [row] = await db
    .update(pharmacies)
    .set({ ...data, updated_at: new Date() })
    .where(eq(pharmacies.id, id))
    .returning();
  return row;
}

export async function deletePharmacy(id: string) {
  await getPharmacyById(id);
  const [row] = await db
    .update(pharmacies)
    .set({ is_active: false, updated_at: new Date() })
    .where(eq(pharmacies.id, id))
    .returning();
  return row;
}

export async function getOrders(query: OrderQuery) {
  const { page, limit, pharmacy_id, status } = query;
  const offset = (page - 1) * limit;

  const filters: SQL[] = [];
  if (pharmacy_id) filters.push(eq(orders.pharmacy_id, pharmacy_id));
  if (status) filters.push(eq(orders.status, status));

  const where = filters.length > 0 ? and(...filters) : undefined;

  const [rows, [{ count }]] = await Promise.all([
    db
      .select({
        id: orders.id,
        order_number: orders.order_number,
        pharmacy_id: orders.pharmacy_id,
        pharmacy_name: pharmacies.name,
        status: orders.status,
        total_amount: orders.total_amount,
        notes: orders.notes,
        fulfilled_at: orders.fulfilled_at,
        created_at: orders.created_at,
        updated_at: orders.updated_at,
      })
      .from(orders)
      .innerJoin(pharmacies, eq(orders.pharmacy_id, pharmacies.id))
      .where(where)
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(orders).where(where),
  ]);

  return {
    data: rows,
    pagination: { total: count, page, limit, pages: Math.ceil(count / limit) },
  };
}

export async function getOrderById(id: string) {
  const [[order], items] = await Promise.all([
    db.select().from(orders).where(eq(orders.id, id)),
    db
      .select({
        id: order_items.id,
        order_id: order_items.order_id,
        medication_id: order_items.medication_id,
        medication_name: medications.name,
        quantity_ordered: order_items.quantity_ordered,
        quantity_fulfilled: order_items.quantity_fulfilled,
        unit_price: order_items.unit_price,
        line_total: order_items.line_total,
        created_at: order_items.created_at,
      })
      .from(order_items)
      .innerJoin(medications, eq(order_items.medication_id, medications.id))
      .where(eq(order_items.order_id, id)),
  ]);

  if (!order) throw new AppError(404, "Order not found");
  return { ...order, items };
}

export async function createOrder(data: InsertOrder) {
  const { items, ...orderData } = data;

  const itemsWithTotals = items.map((item) => ({
    ...item,
    line_total: (parseFloat(item.unit_price) * item.quantity_ordered).toFixed(
      2,
    ),
  }));

  const total_amount = itemsWithTotals
    .reduce((sum, item) => sum + parseFloat(item.line_total), 0)
    .toFixed(2);

  return await db.transaction(async (tx) => {
    const [order] = await tx
      .insert(orders)
      .values({ ...orderData, total_amount })
      .returning();

    const insertedItems = await tx
      .insert(order_items)
      .values(itemsWithTotals.map((item) => ({ ...item, order_id: order.id })))
      .returning();

    return { ...order, items: insertedItems };
  });
}

export async function updateOrder(id: string, data: UpdateOrder) {
  const [order] = await db.select().from(orders).where(eq(orders.id, id));
  if (!order) throw new AppError(404, "Order not found");

  const set: Record<string, unknown> = { ...data, updated_at: new Date() };
  if (data.status === "fulfilled") {
    set.fulfilled_at = new Date();
  }

  const [row] = await db
    .update(orders)
    .set(set)
    .where(eq(orders.id, id))
    .returning();
  return row;
}

export async function cancelOrder(id: string) {
  const [order] = await db.select().from(orders).where(eq(orders.id, id));
  if (!order) throw new AppError(404, "Order not found");
  if (order.status === "cancelled") {
    throw new AppError(400, "Order is already cancelled");
  }
  if (order.status === "fulfilled") {
    throw new AppError(400, "Cannot cancel a fulfilled order");
  }

  const [row] = await db
    .update(orders)
    .set({ status: "cancelled", updated_at: new Date() })
    .where(eq(orders.id, id))
    .returning();
  return row;
}

export async function getOrderItems(orderId: string) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order) throw new AppError(404, "Order not found");

  return db
    .select({
      id: order_items.id,
      order_id: order_items.order_id,
      medication_id: order_items.medication_id,
      medication_name: medications.name,
      quantity_ordered: order_items.quantity_ordered,
      quantity_fulfilled: order_items.quantity_fulfilled,
      unit_price: order_items.unit_price,
      line_total: order_items.line_total,
      created_at: order_items.created_at,
    })
    .from(order_items)
    .innerJoin(medications, eq(order_items.medication_id, medications.id))
    .where(eq(order_items.order_id, orderId));
}

export async function addOrderItem(orderId: string, data: AddOrderItem) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order) throw new AppError(404, "Order not found");
  if (order.status !== "draft") {
    throw new AppError(400, "Items can only be added to draft orders");
  }

  const line_total = (
    parseFloat(data.unit_price) * data.quantity_ordered
  ).toFixed(2);

  return await db.transaction(async (tx) => {
    const [item] = await tx
      .insert(order_items)
      .values({ ...data, order_id: orderId, line_total })
      .returning();

    const [{ total }] = await tx
      .select({
        total: sql<string>`coalesce(sum(${order_items.line_total}), '0')`,
      })
      .from(order_items)
      .where(eq(order_items.order_id, orderId));

    await tx
      .update(orders)
      .set({ total_amount: total, updated_at: new Date() })
      .where(eq(orders.id, orderId));

    return item;
  });
}

export async function updateOrderItem(
  orderId: string,
  itemId: string,
  data: UpdateOrderItem,
) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order) throw new AppError(404, "Order not found");
  if (order.status !== "draft") {
    throw new AppError(400, "Items can only be modified on draft orders");
  }

  const [item] = await db
    .select()
    .from(order_items)
    .where(and(eq(order_items.id, itemId), eq(order_items.order_id, orderId)));
  if (!item) throw new AppError(404, "Order item not found");

  const quantity = data.quantity_ordered ?? item.quantity_ordered;
  const price = data.unit_price ?? item.unit_price;
  const line_total = (parseFloat(price) * quantity).toFixed(2);

  return await db.transaction(async (tx) => {
    const [updatedItem] = await tx
      .update(order_items)
      .set({ ...data, line_total })
      .where(eq(order_items.id, itemId))
      .returning();

    const [{ total }] = await tx
      .select({
        total: sql<string>`coalesce(sum(${order_items.line_total}), '0')`,
      })
      .from(order_items)
      .where(eq(order_items.order_id, orderId));

    await tx
      .update(orders)
      .set({ total_amount: total, updated_at: new Date() })
      .where(eq(orders.id, orderId));

    return updatedItem;
  });
}

export async function removeOrderItem(orderId: string, itemId: string) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order) throw new AppError(404, "Order not found");
  if (order.status !== "draft") {
    throw new AppError(400, "Items can only be removed from draft orders");
  }

  const [item] = await db
    .select()
    .from(order_items)
    .where(and(eq(order_items.id, itemId), eq(order_items.order_id, orderId)));
  if (!item) throw new AppError(404, "Order item not found");

  return await db.transaction(async (tx) => {
    await tx.delete(order_items).where(eq(order_items.id, itemId));

    const [{ total }] = await tx
      .select({
        total: sql<string>`coalesce(sum(${order_items.line_total}), '0')`,
      })
      .from(order_items)
      .where(eq(order_items.order_id, orderId));

    await tx
      .update(orders)
      .set({ total_amount: total, updated_at: new Date() })
      .where(eq(orders.id, orderId));

    return item;
  });
}

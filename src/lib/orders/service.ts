import type { DocumentData } from "firebase-admin/firestore";
import { createHttpError } from "@/lib/api/errors";
import { getCartItems } from "@/lib/cart/service";
import { getProductById, revalidateCatalogCache } from "@/lib/catalog/service";
import { serializeProduct } from "@/lib/catalog/serializers";
import { getCheckoutSessionById } from "@/lib/checkout/service";
import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import {
  buildWhatsappOrderFingerprint,
  shouldReuseWhatsappOrder,
} from "@/lib/orders/idempotency";
import { buildStockUpdateForOrderItem } from "@/lib/orders/stock";
import type {
  CheckoutSessionItem,
  CheckoutSessionPricing,
  CheckoutSessionShipping,
  CustomerAddress,
  FirebaseDateLike,
  OrderSummary,
  Product,
  RawProductRecord,
  SerializedCartItem,
} from "@/types/domain";

interface OrderRecord {
  id: string;
  userId: string;
  createdAt: FirebaseDateLike;
  status?: string;
  total?: number;
}

interface EcommerceOrderRecord {
  cartId: string;
  checkoutSessionId: string;
  createdAt: FirebaseDateLike;
  customerUid: string | null;
  fulfillmentStatus: "unfulfilled";
  items: CheckoutSessionItem[];
  orderSource?: "checkout" | "whatsapp";
  orderFingerprint?: string | null;
  paymentStatus: "unpaid";
  pricing: CheckoutSessionPricing;
  shipping: CheckoutSessionShipping;
  addressSnapshot: CustomerAddress | null;
  status: "pending_confirmation" | "confirmed" | "cancelled";
  updatedAt: FirebaseDateLike;
}

interface OrderItemInput {
  id_producto?: unknown;
  productId?: unknown;
  cantidad?: unknown;
  precio_unitario?: unknown;
  precio?: unknown;
}

interface NormalizedOrderItem {
  id_producto: string;
  cantidad: number;
  precio_unitario: number;
  nombre: string;
  imagen: string | null;
}

interface CheckoutPayload {
  nombre?: unknown;
  apellido?: unknown;
  dni?: unknown;
  telefono?: unknown;
  correo?: unknown;
  direccion?: unknown;
  ciudad?: unknown;
  provincia?: unknown;
  codigo_postal?: unknown;
  referenciaDeEntrega?: unknown;
  carritoId?: unknown;
}

function ensureString(value: unknown, message: string): string {
  const normalized = typeof value === "string" ? value.trim() : "";

  if (!normalized) {
    throw createHttpError(400, message);
  }

  return normalized;
}

function normalizeQuantity(value: unknown, message: string): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw createHttpError(400, message);
  }

  return parsed;
}

function normalizePrice(value: unknown, message: string): number {
  const parsed = Number(value);

  if (Number.isNaN(parsed) || parsed < 0) {
    throw createHttpError(400, message);
  }

  return parsed;
}

function toIsoString(value: FirebaseDateLike): string {
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return new Date(typeof value === "string" ? value : Date.now()).toISOString();
}

function serializeOrder(order: OrderRecord) {
  return {
    id_orden: order.id,
    id_user: order.userId,
    fecha: toIsoString(order.createdAt),
    status: order.status || "pending",
    total: Number(order.total || 0),
  };
}

function serializeOrderDetail(orderId: string, item: NormalizedOrderItem, index: number) {
  return {
    id_detalle: `${orderId}:${index + 1}`,
    id_orden: orderId,
    id_producto: item.id_producto,
    cantidad: item.cantidad,
    precio_unitario: item.precio_unitario,
    nombre: item.nombre || "",
    imagen: item.imagen || null,
  };
}

function serializeEcommerceOrder(
  orderId: string,
  record: EcommerceOrderRecord
): OrderSummary {
  return {
    id_orden: orderId,
    customer_uid: record.customerUid || null,
    checkout_session_id: record.checkoutSessionId,
    cart_id: record.cartId,
    order_source: record.orderSource || "checkout",
    status: record.status,
    payment_status: record.paymentStatus,
    fulfillment_status: record.fulfillmentStatus,
    items: record.items,
    pricing: record.pricing,
    shipping: record.shipping,
    address: record.addressSnapshot,
    created_at: toIsoString(record.createdAt),
    updated_at: toIsoString(record.updatedAt),
  };
}

function serializeCartItemsForOrder(items: SerializedCartItem[]): CheckoutSessionItem[] {
  return items.map((item) => ({
    clave: item.clave,
    cantidad: item.cantidad,
    id_producto: item.id_producto,
    imagen: item.imagen,
    medida_seleccionada: item.medida_seleccionada,
    nombre: item.nombre,
    precio: item.precio,
    precio_lista: item.precio_lista,
    subtotal: item.precio * item.cantidad,
    subtotal_lista: item.precio_lista * item.cantidad,
    tiene_promocion: item.tiene_promocion,
  }));
}

function buildOrderPricing(items: CheckoutSessionItem[]): CheckoutSessionPricing {
  const subtotal = items.reduce((total, item) => total + item.subtotal, 0);
  const subtotalLista = items.reduce((total, item) => total + item.subtotal_lista, 0);

  return {
    subtotal,
    subtotal_lista: subtotalLista,
    descuentos_total: Math.max(0, subtotalLista - subtotal),
    shipping_total: null,
    total: subtotal,
  };
}

function buildWhatsappShipping(): CheckoutSessionShipping {
  return {
    destination_postal_code: null,
    fulfillment_type: "pickup",
    pickup_label: "Coordinar por WhatsApp",
    quotes: [],
    request: null,
    requires_address: false,
    selected_quote: null,
    selected_quote_id: null,
    status: "pending",
  };
}

function toEcommerceOrderRecord(data: DocumentData): EcommerceOrderRecord {
  return {
    cartId: typeof data.cartId === "string" ? data.cartId : "",
    checkoutSessionId: typeof data.checkoutSessionId === "string" ? data.checkoutSessionId : "",
    createdAt: data.createdAt as FirebaseDateLike,
    customerUid: typeof data.customerUid === "string" ? data.customerUid : null,
    fulfillmentStatus: data.fulfillmentStatus === "unfulfilled" ? "unfulfilled" : "unfulfilled",
    items: Array.isArray(data.items) ? (data.items as CheckoutSessionItem[]) : [],
    orderSource: data.orderSource === "whatsapp" ? "whatsapp" : "checkout",
    orderFingerprint: typeof data.orderFingerprint === "string" ? data.orderFingerprint : null,
    paymentStatus: "unpaid",
    pricing: data.pricing as CheckoutSessionPricing,
    shipping: data.shipping as CheckoutSessionShipping,
    addressSnapshot: (data.addressSnapshot as CustomerAddress | null) ?? null,
    status:
      data.status === "confirmed" || data.status === "cancelled"
        ? data.status
        : "pending_confirmation",
    updatedAt: data.updatedAt as FirebaseDateLike,
  };
}

export async function createWhatsappOrderFromCart(
  cartId: string,
  customerUid: string | null = null
): Promise<OrderSummary> {
  const normalizedCartId = ensureString(cartId, "El carrito es requerido.");
  const items = serializeCartItemsForOrder(await getCartItems(normalizedCartId, customerUid));

  if (items.length === 0) {
    throw createHttpError(400, "El carrito no tiene productos.");
  }

  const db = getFirebaseAdminDb();
  const orderFingerprint = buildWhatsappOrderFingerprint(items);
  const existingSnapshot = await db
    .collection("orders")
    .where("cartId", "==", normalizedCartId)
    .get();
  const reusableOrder = existingSnapshot.docs.find((doc) => {
    const order = toEcommerceOrderRecord(doc.data());
    return (
      order.orderSource === "whatsapp" &&
      shouldReuseWhatsappOrder({
        existingFingerprint: order.orderFingerprint || null,
        nextFingerprint: orderFingerprint,
        status: order.status,
      })
    );
  });

  if (reusableOrder) {
    return serializeEcommerceOrder(
      reusableOrder.id,
      toEcommerceOrderRecord(reusableOrder.data())
    );
  }

  const orderRef = db.collection("orders").doc();
  const now = new Date();
  const nextOrder: EcommerceOrderRecord = {
    cartId: normalizedCartId,
    checkoutSessionId: "",
    createdAt: now,
    customerUid,
    fulfillmentStatus: "unfulfilled",
    items,
    orderSource: "whatsapp",
    orderFingerprint,
    paymentStatus: "unpaid",
    pricing: buildOrderPricing(items),
    shipping: buildWhatsappShipping(),
    addressSnapshot: null,
    status: "pending_confirmation",
    updatedAt: now,
  };

  await orderRef.set(nextOrder);

  const orderDoc = await orderRef.get();
  return serializeEcommerceOrder(
    orderRef.id,
    toEcommerceOrderRecord(orderDoc.data() ?? nextOrder)
  );
}

export async function listAdminOrders(): Promise<OrderSummary[]> {
  const db = getFirebaseAdminDb();
  const snapshot = await db.collection("orders").get();

  return snapshot.docs
    .map((doc) => serializeEcommerceOrder(doc.id, toEcommerceOrderRecord(doc.data())))
    .sort(
      (left, right) =>
        new Date(right.created_at || 0).getTime() - new Date(left.created_at || 0).getTime()
    );
}

export async function updateAdminOrderStatus(
  orderId: string,
  status: "confirmed" | "cancelled"
): Promise<OrderSummary> {
  const normalizedOrderId = ensureString(orderId, "El pedido es requerido.");
  const db = getFirebaseAdminDb();
  const orderRef = db.collection("orders").doc(normalizedOrderId);
  const updatedAt = new Date();

  await db.runTransaction(async (transaction) => {
    const orderDoc = await transaction.get(orderRef);

    if (!orderDoc.exists) {
      throw createHttpError(404, "Pedido no encontrado.");
    }

    const order = toEcommerceOrderRecord(orderDoc.data() ?? {});

    if (order.status === status) {
      return;
    }

    if (order.status === "confirmed") {
      throw createHttpError(400, "El pedido ya fue confirmado.");
    }

    if (status === "cancelled") {
      transaction.update(orderRef, {
        status: "cancelled",
        updatedAt,
      });
      return;
    }

    for (const item of order.items) {
      const productRef = db.collection("products").doc(item.id_producto);
      const productDoc = await transaction.get(productRef);

      if (!productDoc.exists) {
        throw createHttpError(404, `Producto no encontrado: ${item.nombre}`);
      }

      const product = serializeProduct({
        id: productDoc.id,
        ...(productDoc.data() as Omit<RawProductRecord, "id">),
      });
      const stockUpdate = buildStockUpdateForOrderItem(product as Product, item);

      transaction.update(productRef, {
        stock: stockUpdate.stock,
        ...(stockUpdate.variants ? { variants: stockUpdate.variants } : {}),
        updatedAt,
      });
    }

    transaction.update(orderRef, {
      status: "confirmed",
      updatedAt,
    });
  });

  revalidateCatalogCache();
  const orderDoc = await orderRef.get();
  return serializeEcommerceOrder(
    orderDoc.id,
    toEcommerceOrderRecord(orderDoc.data() ?? {})
  );
}

async function normalizeOrderItems(items: unknown): Promise<NormalizedOrderItem[]> {
  if (!Array.isArray(items) || items.length === 0) {
    throw createHttpError(400, "Debes enviar al menos un item para la orden.");
  }

  const normalizedItems = await Promise.all(
    items.map(async (item) => {
      const orderItem = (item ?? {}) as OrderItemInput;
      const productId = ensureString(
        typeof orderItem.id_producto === "string" ? orderItem.id_producto : typeof orderItem.productId === "string" ? orderItem.productId : "",
        "Cada item debe incluir id_producto."
      );
      const cantidad = normalizeQuantity(
        orderItem.cantidad,
        "Cada item debe tener una cantidad valida."
      );
      const explicitPrice = orderItem.precio_unitario ?? orderItem.precio;
      const product = await getProductById(productId);

      if (!product) {
        throw createHttpError(404, `Producto no encontrado: ${productId}`);
      }

      return {
        id_producto: productId,
        cantidad,
        precio_unitario:
          explicitPrice !== undefined
            ? normalizePrice(explicitPrice, "Precio unitario invalido.")
            : Number(product.precio || 0),
        nombre: product.nombre,
        imagen: product.imagen,
      };
    })
  );

  return normalizedItems;
}

export async function createOrder(userId: string, items: unknown) {
  const normalizedUserId = ensureString(userId, "El id_user es requerido.");
  const normalizedItems = await normalizeOrderItems(items);
  const total = normalizedItems.reduce(
    (accumulator, item) => accumulator + item.precio_unitario * item.cantidad,
    0
  );

  const db = getFirebaseAdminDb();
  const now = new Date();
  const ref = await db.collection("orders").add({
    userId: normalizedUserId,
    items: normalizedItems,
    total,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  });

  return { id_orden: ref.id };
}

export async function listOrdersByUser(userId: string) {
  const normalizedUserId = ensureString(userId, "El id_user es requerido.");
  const db = getFirebaseAdminDb();
  const snapshot = await db
    .collection("orders")
    .where("userId", "==", normalizedUserId)
    .get();

  return snapshot.docs
    .map((doc) => serializeOrder({ id: doc.id, ...(doc.data() as Omit<OrderRecord, "id">) }))
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
}

export async function getOrderDetails(orderId: string) {
  const normalizedOrderId = ensureString(orderId, "El id_orden es requerido.");
  const db = getFirebaseAdminDb();
  const doc = await db.collection("orders").doc(normalizedOrderId).get();

  if (!doc.exists) {
    throw createHttpError(404, "Orden no encontrada.");
  }

  const data = doc.data() ?? {};
  const items = Array.isArray(data.items) ? (data.items as NormalizedOrderItem[]) : [];

  return items.map((item, index) => serializeOrderDetail(doc.id, item, index));
}

export async function createCheckout(payload: CheckoutPayload) {
  const normalizedPayload = {
    nombre: ensureString(payload.nombre, "El nombre es requerido."),
    apellido: ensureString(payload.apellido, "El apellido es requerido."),
    dni: ensureString(payload.dni, "El DNI es requerido."),
    telefono: ensureString(payload.telefono, "El telefono es requerido."),
    correo: ensureString(payload.correo, "El correo es requerido."),
    direccion: typeof payload.direccion === "string" ? payload.direccion.trim() : "",
    ciudad: typeof payload.ciudad === "string" ? payload.ciudad.trim() : "",
    provincia: typeof payload.provincia === "string" ? payload.provincia.trim() : "",
    codigo_postal:
      typeof payload.codigo_postal === "string"
        ? payload.codigo_postal.trim()
        : "",
    referenciaDeEntrega: ensureString(
      payload.referenciaDeEntrega,
      "La referencia de entrega es requerida."
    ),
    carritoId: typeof payload.carritoId === "string" ? payload.carritoId.trim() : "",
  };

  const db = getFirebaseAdminDb();
  const now = new Date();
  const ref = await db.collection("checkouts").add({
    ...normalizedPayload,
    createdAt: now,
  });

  return {
    id_checkout: ref.id,
    message: "Checkout realizado con exito.",
  };
}

export async function getOrderByIdForCustomer(
  customerUid: string,
  orderId: string
): Promise<OrderSummary> {
  const normalizedCustomerUid = ensureString(customerUid, "El cliente es requerido.");
  const normalizedOrderId = ensureString(orderId, "La orden es requerida.");
  const db = getFirebaseAdminDb();
  const orderDoc = await db.collection("orders").doc(normalizedOrderId).get();

  if (!orderDoc.exists) {
    throw createHttpError(404, "Orden no encontrada.");
  }

  const order = orderDoc.data() as EcommerceOrderRecord;

  if (order.customerUid !== normalizedCustomerUid) {
    throw createHttpError(404, "Orden no encontrada.");
  }

  return serializeEcommerceOrder(orderDoc.id, order);
}

export async function listOrdersByCustomer(
  customerUid: string
): Promise<OrderSummary[]> {
  const normalizedCustomerUid = ensureString(customerUid, "El cliente es requerido.");
  const db = getFirebaseAdminDb();
  const snapshot = await db.collection("orders").where("customerUid", "==", normalizedCustomerUid).get();

  return snapshot.docs
    .map((doc) => serializeEcommerceOrder(doc.id, doc.data() as EcommerceOrderRecord))
    .sort(
      (left, right) =>
        new Date(right.created_at || 0).getTime() - new Date(left.created_at || 0).getTime(),
    );
}

export async function createOrderFromCheckoutSession(
  customerUid: string,
  checkoutSessionId: string
): Promise<OrderSummary> {
  const normalizedCustomerUid = ensureString(customerUid, "El cliente es requerido.");
  const normalizedCheckoutSessionId = ensureString(
    checkoutSessionId,
    "La sesion de checkout es requerida."
  );
  const checkoutSession = await getCheckoutSessionById(
    normalizedCustomerUid,
    normalizedCheckoutSessionId
  );

  if (checkoutSession.status === "converted" && checkoutSession.order_id) {
    return getOrderByIdForCustomer(normalizedCustomerUid, checkoutSession.order_id);
  }

  if (checkoutSession.status === "expired") {
    throw createHttpError(400, "La sesion de checkout ya expiro.");
  }

  if (checkoutSession.items.length === 0) {
    throw createHttpError(400, "La sesion de checkout no tiene items.");
  }

  if (
    checkoutSession.shipping.fulfillment_type === "shipping" &&
    checkoutSession.shipping.requires_address &&
    !checkoutSession.address
  ) {
    throw createHttpError(400, "Completa una direccion antes de confirmar el pedido.");
  }

  if (
    checkoutSession.shipping.fulfillment_type === "shipping" &&
    checkoutSession.shipping.quotes.length > 0 &&
    !checkoutSession.shipping.selected_quote
  ) {
    throw createHttpError(400, "Selecciona una opcion de envio antes de confirmar el pedido.");
  }

  const db = getFirebaseAdminDb();
  const orderRef = db.collection("orders").doc();
  const sessionRef = db.collection("checkout_sessions").doc(normalizedCheckoutSessionId);
  const now = new Date();
  const orderRecord: EcommerceOrderRecord = {
    cartId: checkoutSession.cart_id,
    checkoutSessionId: normalizedCheckoutSessionId,
    createdAt: now,
    customerUid: normalizedCustomerUid,
    fulfillmentStatus: "unfulfilled",
    items: checkoutSession.items,
    paymentStatus: "unpaid",
    pricing: checkoutSession.pricing,
    shipping: checkoutSession.shipping,
    addressSnapshot: checkoutSession.address,
    status: "pending_confirmation",
    updatedAt: now,
  };

  try {
    await db.runTransaction(async (transaction) => {
      const sessionDoc = await transaction.get(sessionRef);

      if (!sessionDoc.exists) {
        throw createHttpError(404, "Sesion de checkout no encontrada.");
      }

      const sessionData = sessionDoc.data() as {
        customerUid?: string;
        orderId?: string | null;
        status?: string;
      };

      if (sessionData.customerUid !== normalizedCustomerUid) {
        throw createHttpError(404, "Sesion de checkout no encontrada.");
      }

      if (sessionData.status === "converted" && sessionData.orderId) {
        throw createHttpError(409, sessionData.orderId);
      }

      transaction.set(orderRef, orderRecord);
      transaction.set(
        sessionRef,
        {
          orderId: orderRef.id,
          status: "converted",
          updatedAt: now,
        },
        { merge: true }
      );
    });
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      "statusCode" in error &&
      (error as { statusCode?: number }).statusCode === 409
    ) {
      return getOrderByIdForCustomer(normalizedCustomerUid, error.message);
    }

    throw error;
  }

  return serializeEcommerceOrder(orderRef.id, orderRecord);
}

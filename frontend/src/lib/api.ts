import { storage } from "@/src/utils/storage";

const API_BASE = (process.env.EXPO_PUBLIC_BACKEND_URL as string) + "/api";
const TOKEN_KEY = "tpt_auth_token";

export async function getToken(): Promise<string | null> {
  return await storage.secureGet<string>(TOKEN_KEY, "");
}

export async function setToken(token: string): Promise<void> {
  await storage.secureSet(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await storage.secureRemove(TOKEN_KEY);
}

async function request<T = any>(
  path: string,
  options: { method?: string; body?: any; auth?: boolean } = {},
): Promise<T> {
  const { method = "GET", body, auth = true } = options;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) {
    const token = await getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const message = data?.detail || data?.message || `Lỗi ${res.status}`;
    throw new Error(typeof message === "string" ? message : JSON.stringify(message));
  }
  return data as T;
}

// ---------- Types ----------
export type User = {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: "admin" | "customer";
  created_at: string;
};

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
};

export type OrderItem = {
  menu_id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string;
};

export type Order = {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  items: OrderItem[];
  total: number;
  address: string;
  phone: string;
  note: string;
  status: string;
  created_at: string;
};

// ---------- Auth ----------
export const api = {
  register: (data: { email: string; password: string; name: string; phone?: string }) =>
    request<{ access_token: string; user: User }>("/auth/register", { method: "POST", body: data, auth: false }),

  login: (data: { email: string; password: string }) =>
    request<{ access_token: string; user: User }>("/auth/login", { method: "POST", body: data, auth: false }),

  me: () => request<User>("/auth/me"),

  // Menu
  getMenu: () => request<MenuItem[]>("/menu", { auth: false }),
  getMenuItem: (id: string) => request<MenuItem>(`/menu/${id}`, { auth: false }),

  // Orders
  createOrder: (data: {
    items: OrderItem[];
    total: number;
    address: string;
    phone: string;
    note?: string;
  }) => request<Order>("/orders", { method: "POST", body: data }),
  myOrders: () => request<Order[]>("/orders/my"),

  // Admin
  adminCustomers: () => request<User[]>("/admin/customers"),
  adminOrders: () => request<Order[]>("/admin/orders"),
  adminStats: () =>
    request<{ total_customers: number; total_orders: number; total_menu: number; total_revenue: number }>(
      "/admin/stats",
    ),
  adminUpdateOrder: (id: string, status: string) =>
    request(`/admin/orders/${id}`, { method: "PATCH", body: { status } }),
};

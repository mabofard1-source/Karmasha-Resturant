import React, { createContext, useContext, useEffect, useMemo, useReducer } from "react";

const STORAGE_KEY = "karmasha-cart";
const CartContext = createContext(null);

// "45", 45, "45 EGP" or "$4.50" -> number
const toNumber = (v) => Number(String(v ?? 0).replace(/[^\d.]/g, "")) || 0;

// state shape: { [productId]: { product, qty } }
function reducer(items, action) {
  switch (action.type) {
    case "ADD": {
      const { product } = action;
      const current = items[product.id];
      return { ...items, [product.id]: { product, qty: (current?.qty ?? 0) + 1 } };
    }
    case "DECREMENT": {
      const current = items[action.id];
      if (!current) return items;
      if (current.qty <= 1) {
        const { [action.id]: _removed, ...rest } = items;
        return rest;
      }
      return { ...items, [action.id]: { ...current, qty: current.qty - 1 } };
    }
    case "REMOVE": {
      const { [action.id]: _removed, ...rest } = items;
      return rest;
    }
    case "CLEAR":
      return {};
    default:
      return items;
  }
}

function loadInitial() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));

    if (!stored || typeof stored !== "object" || Array.isArray(stored)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(stored).filter(([id, entry]) =>
        id &&
        entry &&
        typeof entry === "object" &&
        entry.product &&
        typeof entry.product === "object" &&
        entry.product.id === id &&
        Number.isFinite(Number(entry.qty)) &&
        Number(entry.qty) > 0
      ).map(([id, entry]) => [
        id,
        { product: entry.product, qty: Math.floor(Number(entry.qty)) }
      ])
    );
  } catch {
    return {};
  }
}

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(reducer, undefined, loadInitial);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage unavailable: cart still works for this session */
    }
  }, [items]);

  const value = useMemo(() => {
    const list = Object.values(items);
    return {
      items: list,
      count: list.reduce((n, i) => n + i.qty, 0),
      total: list.reduce((sum, i) => sum + toNumber(i.product.price) * i.qty, 0),
      getQty: (id) => items[id]?.qty ?? 0,
      add: (product) => dispatch({ type: "ADD", product }),
      decrement: (id) => dispatch({ type: "DECREMENT", id }),
      remove: (id) => dispatch({ type: "REMOVE", id }),
      clear: () => dispatch({ type: "CLEAR" }),
      toNumber,
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

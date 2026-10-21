
import React, { useEffect, useState } from "react";
import { useCart } from "./CartContext.jsx";
import QuantityControl from "./QuantityControl.jsx";


const fmt = (n) => {
  const number = Number(n) || 0;
  return Number.isInteger(number) ? String(number) : number.toFixed(2);
};

export default function CartDrawer({ currency = "ج.م" }) {
  const { items, count, total, toNumber, clear } = useCart();
  const [open, setOpen] = useState(false);

  // إغلاق السلة when pressing Escape
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  // Prevent background scrolling while cart is open
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const handleCheckout = () => {
    setOpen(false);
  };

  const handleClearCart = () => {
    clear();
  };

  return (
    <>
      {/* Floating cart bar */}
      {count > 0 && !open && (
        <button
          type="button"
          className="kc-bar"
          onClick={() => setOpen(true)}
          aria-label={`اعرض طلبك، ${count} صنف`}
        >
          <span className="kc-bar-count">{count}</span>

          <span>اعرض طلبك</span>

          <span className="kc-bar-total">
            {fmt(total)} {currency}
          </span>
        </button>
      )}

      {/* Cart drawer */}
      {open && (
        <div className="kc-layer">
          <button
            type="button"
            className="kc-backdrop"
            aria-label="إغلاق السلة"
            onClick={() => setOpen(false)}
          />

          <section
            className="kc-panel"
            role="dialog"
            aria-modal="true"
            aria-label="طلبك"
          >
            {/* Header */}
            <header className="kc-panel-head">
              <div>
                <h2>طلبك</h2>
                <p>
                  {count} {count === 1 ? "صنف" : "أصناف"} في طلبك
                </p>
              </div>

              <button
                type="button"
                className="kc-close"
                aria-label="إغلاق السلة"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </header>

            {/* Empty cart */}
            {items.length === 0 ? (
              <div className="kc-empty">
                <p>سلتك فاضية.</p>
                <span>
                  اختار الأصناف اللي بتحبها من المنيو عشان تبدأ طلبك.
                </span>

                <button
                  type="button"
                  className="primary-button"
                  onClick={() => setOpen(false)}
                >
                  شوف المنيو
                </button>
              </div>
            ) : (
              <>
                {/* Cart items */}
                <ul className="kc-list">
                  {items.map(({ product, qty }) => {
                    const price = toNumber(product.price);

                    return (
                      <li className="kc-line" key={product.id}>
                        <div className="kc-line-info">
                          <strong>{product.name}</strong>

                          <small>
                            {fmt(price)} {currency} للقطعة
                          </small>
                        </div>

                        <QuantityControl product={product} />

                        <span className="kc-line-total">
                          {fmt(price * qty)} {currency}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                {/* Cart footer */}
                <footer className="kc-panel-foot">
                  <div className="kc-total">
                    <span>
                      الإجمالي · {count} {count === 1 ? "صنف" : "أصناف"}
                    </span>

                    <strong>
                      {fmt(total)} {currency}
                    </strong>
                  </div>

                  <a
                    className="primary-button kc-checkout-link"
                    href="/checkout"
                    onClick={handleCheckout}
                  >
                    تأكيد الطلب
                  </a>

                  <button
                    type="button"
                    className="kc-clear"
                    onClick={handleClearCart}
                  >
                    إفراغ السلة
                  </button>
                </footer>
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}

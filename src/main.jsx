import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "../styles.css";
import "./karmasha.css";

function SiteWithLoader() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 950);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <>
      <App />
      {loading && <PageLoader />}
    </>
  );
}

function PageLoader() {
  return (
    <div className="page-loader" role="status" aria-label="جارٍ تحميل قرمشة">
      <img className="page-loader-logo" src="/assets/karmasha-logo.png" alt="" />
      <span className="page-loader-name">قرمشة</span>
      <span className="page-loader-caption">طعم يفرق</span>
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <SiteWithLoader />
  </React.StrictMode>
);

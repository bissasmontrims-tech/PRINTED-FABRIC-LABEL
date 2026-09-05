import React from "react";
import ReactDOM from "react-dom/client";
import PFLDashboard from "./pfl-dashboard.jsx";
import AuthGate from "./components/AuthGate.jsx";
import "./index.css";

if (import.meta.env.DEV) {
  import("./lib/dateUtils.js").then((m) => {
    try { m._runDateParserSelfTest(); }
    catch (e) { console.error(e); } // eslint-disable-line no-console
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthGate>
      {({ session, profile, logout }) => (
        <PFLDashboard session={session} profile={profile} onLogout={logout} />
      )}
    </AuthGate>
  </React.StrictMode>
);

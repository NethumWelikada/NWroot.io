// ============================================================
// usePageTitle.js
// Sets the browser tab title for whichever page uses this hook.
// Pass null/undefined for the site's home page (just "NWroot.io"),
// or a string for any other page (renders as "Page | NWroot.io").
// ============================================================

import { useEffect } from "react";

export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | NWroot.io` : "NWroot.io";
  }, [title]);
}

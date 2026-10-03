import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

export const FOUNDER_CAP = 199;

/**
 * Live founder-pass counter, backed by the `stats/founder` Firestore doc.
 * The Stripe webhook (server.ts) and founder promo-code redemptions increment
 * `claimed` transactionally, so this number is real — never hardcoded.
 */
export function useFounderStats() {
  const [claimed, setClaimed] = useState(0);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "stats", "founder"),
      (snap) => {
        setClaimed(snap.exists() ? (snap.data()?.claimed as number) || 0 : 0);
      },
      () => setClaimed(0)
    );
    return () => unsub();
  }, []);

  const remaining = Math.max(0, FOUNDER_CAP - claimed);
  return { claimed, remaining, soldOut: claimed >= FOUNDER_CAP, cap: FOUNDER_CAP };
}

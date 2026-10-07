/**
 * Logged-out session hardening.
 *
 * A previous signed-in session (notably the project owner's) persists its
 * profile in localStorage. When Firebase auth resolves with no user, that
 * stale identity must never leak its creator badge, privileges, NFT access,
 * or last decompose into the logged-out visit.
 *
 * Detection is read-only and idempotent; the wipe records that it ran so
 * every consumer (profile state, goal state, chat state) sees the same
 * answer regardless of effect ordering.
 */

const PROFILE_KEY = "goal_atomizer_user_profile";

const OWNER_SESSION_KEYS = [
  "goal_atomizer_user_profile",
  "atom_is_creator",
  "atom_vip_promo",
  "goal_atomizer_data",
  "goal_atomizer_chat",
  "goal_atomizer_planner",
];

let wipePerformed = false;

export function hasStaleOwnerSession(): boolean {
  if (wipePerformed) return true;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (
        parsed?.isCreator === true ||
        parsed?.founderNumber === 0 ||
        parsed?.email === "faux.fuax@gmail.com"
      ) {
        return true;
      }
    }
    if (localStorage.getItem("atom_is_creator") === "true") return true;
    if (localStorage.getItem("atom_vip_promo") === "FAUX-VIP") return true;
  } catch {
    // Corrupt storage reads as no stale session.
  }
  return false;
}

/**
 * Removes every localStorage key belonging to a stale owner session.
 * Returns true when a stale session was detected (and wiped).
 */
export function wipeStaleOwnerSession(): boolean {
  if (!hasStaleOwnerSession()) return false;
  try {
    OWNER_SESSION_KEYS.forEach((k) => localStorage.removeItem(k));
  } catch {
    // Best effort; state resets below still apply.
  }
  wipePerformed = true;
  return true;
}

/**
 * Stripe Payment Links Configuration
 * 
 * Set USE_LIVE_MODE to:
 * - false: Uses test links (buy.stripe.com/test_...)
 * - true:  Uses live links (buy.stripe.com/...) to accept real credit card payments.
 */

export const USE_LIVE_MODE = true; // Enabled live links with fallback

const TEST_LINKS = {
  tacticalPro: "https://buy.stripe.com/test_6oU28raIc53J4wVdRj4Rq03",
  tacticalProYearly: "https://buy.stripe.com/test_4gMdR9aIc2VBe7vbJb4Rq04",
  vanguardLive: "https://buy.stripe.com/test_cNi3cv7w00Nt3sRaF74Rq01",
  vanguardLiveYearly: "https://buy.stripe.com/test_6oUbJ13fK67N6F38wZ4Rq02",
  founderLifetime: "https://buy.stripe.com/test_28EcN52bG2VB0gFfZr4Rq00",
  voicePacks: {
    vp_30: "https://buy.stripe.com/dRmdR9058bP57E534CbjW05",
    vp_100: "https://buy.stripe.com/dRmcN56tw7yPgaB34CbjW06",
    vp_300: "https://buy.stripe.com/fZu00j4lo7yPbUl6gObjW07",
  }
};

const LIVE_LINKS = {
  tacticalPro: "https://buy.stripe.com/00w5kDg46f1h7E520ybjW00",
  tacticalProYearly: "https://buy.stripe.com/fZueVd19c2ev6A1ax4bjW03",
  vanguardLive: "https://buy.stripe.com/8x2dR9058f1h1fHdJgbjW01",
  vanguardLiveYearly: "https://buy.stripe.com/bJeeVd2dgdXd2jL20ybjW04",
  founderLifetime: "https://buy.stripe.com/4gMcN53hkdXd6A1dJgbjW02",
  voicePacks: {
    vp_30: "https://buy.stripe.com/dRmdR9058bP57E534CbjW05",
    vp_100: "https://buy.stripe.com/dRmcN56tw7yPgaB34CbjW06",
    vp_300: "https://buy.stripe.com/fZu00j4lo7yPbUl6gObjW07",
  }
};

const ACTIVE_CONFIG = USE_LIVE_MODE ? LIVE_LINKS : TEST_LINKS;

// Resolves a link with intelligent fallback between Live and Test if one is missing
function resolveLink(primary: string, fallback: string): string {
  if (primary && primary.trim().length > 0) return primary.trim();
  if (fallback && fallback.trim().length > 0) return fallback.trim();
  return "";
}

export const STRIPE_PAYMENT_LINKS = {
  tacticalPro: resolveLink(ACTIVE_CONFIG.tacticalPro, LIVE_LINKS.tacticalPro || TEST_LINKS.tacticalPro),
  tacticalProYearly: resolveLink(ACTIVE_CONFIG.tacticalProYearly, LIVE_LINKS.tacticalProYearly || TEST_LINKS.tacticalProYearly),
  vanguardLive: resolveLink(ACTIVE_CONFIG.vanguardLive, LIVE_LINKS.vanguardLive || TEST_LINKS.vanguardLive),
  vanguardLiveYearly: resolveLink(ACTIVE_CONFIG.vanguardLiveYearly, LIVE_LINKS.vanguardLiveYearly || TEST_LINKS.vanguardLiveYearly),
  founderLifetime: resolveLink(ACTIVE_CONFIG.founderLifetime, LIVE_LINKS.founderLifetime || TEST_LINKS.founderLifetime),
  voicePacks: {
    vp_30: resolveLink(ACTIVE_CONFIG.voicePacks.vp_30, LIVE_LINKS.voicePacks.vp_30),
    vp_100: resolveLink(ACTIVE_CONFIG.voicePacks.vp_100, LIVE_LINKS.voicePacks.vp_100),
    vp_300: resolveLink(ACTIVE_CONFIG.voicePacks.vp_300, LIVE_LINKS.voicePacks.vp_300),
  }
};

/**
 * Robust cross-context redirector for Stripe Payment Links.
 * Ensures payment links open properly in standard tabs, iframes, and mobile browsers.
 */
export function openStripeCheckout(url: string | undefined): boolean {
  if (!url || typeof url !== "string" || !url.trim()) {
    console.warn("[Stripe Checkout] No payment URL configured");
    return false;
  }

  const cleanUrl = url.trim();

  // 1. Always attempt window.open in a new tab first.
  // This bypasses iframe X-Frame-Options: DENY headers returned by Stripe.
  try {
    const newWindow = window.open(cleanUrl, "_blank", "noopener,noreferrer");
    if (newWindow && !newWindow.closed) {
      return true;
    }
  } catch (err) {
    console.warn("[Stripe] window.open failed, trying fallback:", err);
  }

  // 2. Try top-level navigation if app is running in an iframe
  try {
    if (window.top && window.top !== window) {
      window.top.location.href = cleanUrl;
      return true;
    }
  } catch (err) {
    console.warn("[Stripe] window.top.location blocked by browser sandbox:", err);
  }

  // 3. Fallback to direct window navigation
  try {
    window.location.href = cleanUrl;
    return true;
  } catch (err) {
    console.error("[Stripe] Direct window.location.href navigation failed:", err);
  }

  return false;
}


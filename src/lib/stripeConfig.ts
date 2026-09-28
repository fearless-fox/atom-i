/**
 * Stripe Payment Links Configuration
 * 
 * Set USE_LIVE_MODE to:
 * - false: Uses your test links (buy.stripe.com/test_...) so you can test checkouts with 4242 test cards.
 * - true:  Uses your live links (buy.stripe.com/...) to accept real credit card payments.
 */

export const USE_LIVE_MODE = false; // <-- Change to true when ready to accept real payments!

const TEST_LINKS = {
  tacticalPro: "https://buy.stripe.com/test_6oU28raIc53J4wVdRj4Rq03",
  tacticalProYearly: "https://buy.stripe.com/test_4gMdR9aIc2VBe7vbJb4Rq04",
  vanguardLive: "https://buy.stripe.com/test_cNi3cv7w00Nt3sRaF74Rq01",
  vanguardLiveYearly: "https://buy.stripe.com/test_6oUbJ13fK67N6F38wZ4Rq02",
  founderLifetime: "https://buy.stripe.com/test_28EcN52bG2VB0gFfZr4Rq00",
  voicePacks: {
    vp_30: "",      // $5 for +30 mins
    vp_100: "",     // $12 for +100 mins
    vp_300: "",     // $29 for +300 mins
  }
};

const LIVE_LINKS = {
  tacticalPro: "https://buy.stripe.com/00w5kDg46f1h7E520ybjW00",
  tacticalProYearly: "https://buy.stripe.com/fZueVd19c2ev6A1ax4bjW03",
  vanguardLive: "https://buy.stripe.com/8x2dR9058f1h1fHdJgbjW01",
  vanguardLiveYearly: "https://buy.stripe.com/bJeeVd2dgdXd2jL20ybjW04",
  founderLifetime: "https://buy.stripe.com/4gMcN53hkdXd6A1dJgbjW02",
  voicePacks: {
    vp_30: "https://buy.stripe.com/dRmdR9058bP57E534CbjW05",      // Paste live link for $5 (+30 mins)
    vp_100: "https://buy.stripe.com/dRmcN56tw7yPgaB34CbjW06",     // Paste live link for $12 (+100 mins)
    vp_300: "https://buy.stripe.com/fZu00j4lo7yPbUl6gObjW07",     // Paste live link for $29 (+300 mins)
  }
};

export const STRIPE_PAYMENT_LINKS = USE_LIVE_MODE ? LIVE_LINKS : TEST_LINKS;


// netlify/functions/create-checkout-session.js
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function handler(event) {
  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST,OPTIONS",
      },
    };
  }

  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { uid, plan } = JSON.parse(event.body || "{}");
    if (!uid || !plan) {
      return { statusCode: 400, body: "Missing uid or plan" };
    }

    // 🔎 Debug για να ξέρουμε τι βλέπει ο server
    console.log("create-checkout-session → plan:", plan, {
      hasFamily: !!process.env.FAMILY_SYNC,
      hasTopUp: !!process.env.TOP_UP,
      siteUrl: process.env.SITE_URL,
    });

    // ✅ Επιλογή priceId βάσει του plan και ΤΩΝ ΔΙΚΩΝ ΣΟΥ env vars
    let priceId;
    if (plan === "family") {
      priceId = process.env.FAMILY_SYNC;   // 👈 ΧΡΗΣΙΜΟΠΟΙΕΙ το FAMILY_SYNC
    } else if (plan === "topup") {
      priceId = process.env.TOP_UP;        // 👈 ΧΡΗΣΙΜΟΠΟΙΕΙ το TOP_UP
    } else {
      return { statusCode: 400, body: "Invalid plan" };
    }

    if (!priceId) {
      return {
        statusCode: 500,
        body: `Missing env var for ${plan} (FAMILY_SYNC ή TOP_UP)`,
      };
    }

    const successUrl = `${process.env.SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${process.env.SITE_URL}/cancel`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: uid,
      metadata: { uid, plan },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    console.error("create-checkout-session error:", err);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: `Server error: ${err.message}`,
    };
  }
}

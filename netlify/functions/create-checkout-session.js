import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * POST /.netlify/functions/create-checkout-session
 * body: { uid: string }  // το Firebase uid του user
 */
export async function handler(event) {
  // CORS
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST,OPTIONS"
      }
    };
  }

  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { uid } = JSON.parse(event.body || "{}");
    if (!uid) {
      return { statusCode: 400, body: "Missing uid" };
    }
    if (!process.env.PRICE_ID) {
      return { statusCode: 500, body: "PRICE_ID not configured" };
    }

    // URL που θα φορτώσει μετά την πληρωμή: success.html → deep-link πίσω στο app
    const successUrl = `${process.env.SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${process.env.SITE_URL}/cancel`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price: process.env.PRICE_ID, // π.χ. price_1SFO... (ΟΧΙ το product id)
          quantity: 1
        }
      ],
      client_reference_id: uid,
      metadata: { uid },
      success_url: successUrl,
      cancel_url: cancelUrl
    });

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ url: session.url })
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: "Server error" };
  }
}

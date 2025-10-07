import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * GET /.netlify/functions/verify-session?session_id=cs_xxx
 * επιστρέφει { paid: boolean, uid: string }
 */
export async function handler(event) {
  try {
    const sessionId = (event.queryStringParameters || {}).session_id;
    if (!sessionId) return { statusCode: 400, body: "Missing session_id" };

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paid =
      session.payment_status === "paid" || session.status === "complete";

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        paid,
        uid: session.metadata?.uid || session.client_reference_id || null
      })
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: "Server error" };
  }
}

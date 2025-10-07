import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Webhook endpoint για Stripe checkout.session.completed
 */
export async function handler(event) {
  const sig = event.headers["stripe-signature"];
  let evt;

  try {
    evt = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET // 👈 θα το φτιάξουμε στο Stripe Dashboard
    );
  } catch (err) {
    console.error("⚠️ Webhook signature verification failed", err.message);
    return {
      statusCode: 400,
      body: `Webhook Error: ${err.message}`,
    };
  }

  // ✅ Αν είναι checkout completed
  if (evt.type === "checkout.session.completed") {
    const session = evt.data.object;
    const uid = session.metadata?.uid || session.client_reference_id;

    console.log(`✅ Payment completed for UID: ${uid}`);

    // 👉 Εδώ μπορείς να κάνεις το activation server-side
    // π.χ. Firestore update, ή DB update
    // Προς το παρόν κάνουμε μόνο log

    // TODO: call your Firebase Admin SDK or DB here to set `premium = true`
    // await activatePremiumForUser(uid);

  }

  return { statusCode: 200, body: "ok" };
}

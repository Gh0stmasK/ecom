"use server";

import Stripe from "stripe";
import { client, writeClient } from "@/sanity/lib/client";
import { CUSTOMER_BY_EMAIL_QUERY } from "@/sanity/queries/customers";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not defined");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-01-28.clover",
});

/**
 * Gets or creates a Stripe customer by email
 * Also syncs the customer to Sanity database
 */
export async function getOrCreateStripeCustomer(
  email: string,
  name: string,
  clerkUserId: string
): Promise<{ stripeCustomerId: string; sanityCustomerId: string }> {
  // First, check if customer already exists in Sanity
  const existingCustomer = await client.fetch(CUSTOMER_BY_EMAIL_QUERY, {
    email,
  });

  if (existingCustomer?.stripeCustomerId) {
    // Verify the Stripe customer still exists
    try {
      await stripe.customers.retrieve(existingCustomer.stripeCustomerId);
      // Customer exists in both Sanity and Stripe, return existing IDs
      return {
        stripeCustomerId: existingCustomer.stripeCustomerId,
        sanityCustomerId: existingCustomer._id,
      };
    } catch (error: any) {
      // Stripe customer doesn't exist anymore, continue to create a new one
      console.warn(
        `Stripe customer ${existingCustomer.stripeCustomerId} not found, creating new one for ${email}`
      );
    }
  }

  // Check if customer exists in Stripe by email
  const existingStripeCustomers = await stripe.customers.list({
    email,
    limit: 1,
  });

  let stripeCustomerId: string;

  if (existingStripeCustomers.data.length > 0) {
    // Customer exists in Stripe
    stripeCustomerId = existingStripeCustomers.data[0].id;
  } else {
    // Create new Stripe customer
    const newStripeCustomer = await stripe.customers.create({
      email,
      name,
      metadata: {
        clerkUserId,
      },
    });
    stripeCustomerId = newStripeCustomer.id;
  }

  // Create or update customer in Sanity
  if (existingCustomer) {
    // Update existing Sanity customer with the new/valid Stripe ID
    await writeClient
      .patch(existingCustomer._id)
      .set({ stripeCustomerId, clerkUserId, name, updatedAt: new Date().toISOString() })
      .commit();
    return {
      stripeCustomerId,
      sanityCustomerId: existingCustomer._id,
    };
  }

  // Create new customer in Sanity
  const newSanityCustomer = await writeClient.create({
    _type: "customer",
    email,
    name,
    clerkUserId,
    stripeCustomerId,
    createdAt: new Date().toISOString(),
  });

  return {
    stripeCustomerId,
    sanityCustomerId: newSanityCustomer._id,
  };
}
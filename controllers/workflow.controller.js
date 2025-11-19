import { serve } from "@upstash/workflow/express";

import dayjs from "dayjs";

import Subscription from "../models/mongoose/subscription.model.js";

const REMINDERS = [7, 5, 3, 1]; // days before renewal

export const sendReminders = serve(async (context) => {
  const { subscriptionId } = context.requestPayload;

  const subscription = await fetchSubscription(context, subscriptionId); // Assume this function fetches subscription details

  if (!subscription || subscription.status !== "active") return;

  const renewalDate = dayjs(subscription.renewalDate);

  if (renewalDate.isBefore(dayjs())) {
    console.log(
      `Renewal date has passed for subscription ${subscriptionId} to user ${subscription.user.email}. Stopping workflow.`
    );

    return;
  }

  for (const daysBefore of REMINDERS) {
    const reminderDate = renewalDate.subtract(daysBefore, "day");

    if (reminderDate.isAfter(dayjs())) {
      await sleepUntilReminder(
        context,
        `Reminder ${daysBefore} days before`,
        reminderDate
      );
    }

    await sendReminderEmail(context, `Reminder ${daysBefore} days before`);
  }
});

const fetchSubscription = async (context, subscriptionId) => {
  return await context.run("get subscription", async () => {
    const subscription = await Subscription.findById(subscriptionId)
      .populate("userId", "name email")
      .lean();

    // Debug: Log what we're returning
    console.log("Subscription data:", JSON.stringify(subscription, null, 2));

    return subscription;
  });
};

const sleepUntilReminder = async (context, label, date) => {
  console.log(`Sleeping until ${label} reminder date: ${date.format()}`);
  await context.sleepUntil(label, date.toDate());
};

const sendReminderEmail = async (context, label) => {
  return await context.run(label, () => {
    console.log(`Sending ${label} reminder email...`);
  });
};

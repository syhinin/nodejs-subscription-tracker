import { serve } from "@upstash/workflow/express";
import dayjs from "dayjs";

import Subscription from "../models/mongoose/subscription.model.js";
import { sendReminderEmail } from "../utils/email-send.js";

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
        `${daysBefore} days before reminder`,
        reminderDate
      );
    }

    if(dayjs().isSame(reminderDate, "day"))
    await triggerReminderEmail(context, `${daysBefore} days before reminder`, subscription);
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

const triggerReminderEmail = async (context, label, subscription) => {
  return await context.run(label, async() => {
    console.log(`Trigger ${label} reminder email...`);
    await sendReminderEmail({
      to: subscription.userId.email,
      type: label,
      subscription,
    });
  });
};

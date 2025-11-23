import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Subscription name is required"],
      trim: true,
      minLength: 2,
      maxLength: 100,
    },
    price: {
      type: Number,
      required: [true, "Subscription price is required"],
      min: [0, "Price should be greater than 0"],
    },
    currency: {
      type: String,
      enum: ["USD", "EUR", "GBP", "INR", "JPY"],
      default: "USD",
    },
    frequency: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly"],
      default: "monthly",
    },
    category: {
      type: String,
      enum: [
        "Sport",
        "News",
        "Entertainment",
        "Lifestyle",
        "Finance",
        "Education",
        "Health",
        "Hostings",
        "Other",
      ],
      required: [true, "Subscription category is required"],
    },
    paymentMethod: {
      type: String,
      enum: ["Credit Card", "PayPal", "Bank Transfer", "Other"],
      required: [true, "Payment method is required"],
    },
    status: {
      type: String,
      enum: ["active", "canceled", "expired"],
      default: "active",
    },
    startDate: {
      type: Date,
      required: [true, "Subscription start date is required"],
      validate: {
        validator: function (value) {
          return value <= new Date();
        },
        message: "Start date must be in the past",
      },
    },
    renewalDate: {
      type: Date,
      validate: {
        validator: function (value) {
          return value > this.startDate;
        },
        message: "Renewal date must be after start date",
      },
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

subscriptionSchema.pre("save", function (next) {
  if (!this.renewalDate) {
    const renewalPeriods = {
      daily: 1,
      weekly: 7,
      monthly: 1,
      yearly: 1,
    };

    this.renewalDate = new Date(this.startDate);
    
    if (this.frequency === 'monthly') {
      this.renewalDate.setUTCMonth(this.renewalDate.getUTCMonth() + 1);
    } else if (this.frequency === 'yearly') {
      this.renewalDate.setUTCFullYear(this.renewalDate.getUTCFullYear() + 1);
    } else {
      this.renewalDate.setUTCDate(this.renewalDate.getUTCDate() + renewalPeriods[this.frequency]);
    }
  }

  // Auto-update the status if renewal date has passed
  if (this.renewalDate < new Date()) {
    this.status = "expired";
  }

  next();
});

const SubscriptionModel = mongoose.model("Subscription", subscriptionSchema);

export default SubscriptionModel;

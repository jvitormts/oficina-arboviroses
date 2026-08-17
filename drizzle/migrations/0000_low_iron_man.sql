CREATE TABLE "alertReads" (
	"id" serial PRIMARY KEY NOT NULL,
	"alertId" integer NOT NULL,
	"userId" integer NOT NULL,
	"readAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(180) NOT NULL,
	"summary" text NOT NULL,
	"observations" text,
	"createdBy" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"publishedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "pushSubscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"endpoint" varchar(500) NOT NULL,
	"p256dh" varchar(255) NOT NULL,
	"auth" varchar(255) NOT NULL,
	"userAgent" varchar(500),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" varchar(255),
	"username" varchar(80),
	"passwordHash" varchar(255),
	"role" varchar(10) DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "alertReads" ADD CONSTRAINT "alertReads_alertId_alerts_id_fk" FOREIGN KEY ("alertId") REFERENCES "public"."alerts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alertReads" ADD CONSTRAINT "alertReads_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pushSubscriptions" ADD CONSTRAINT "pushSubscriptions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "alert_reads_alert_user_unique" ON "alertReads" USING btree ("alertId","userId");--> statement-breakpoint
CREATE INDEX "alert_reads_user_idx" ON "alertReads" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "push_subscriptions_user_unique" ON "pushSubscriptions" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "push_subscriptions_endpoint_idx" ON "pushSubscriptions" USING btree ("endpoint");
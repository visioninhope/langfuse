import { createTransport } from "nodemailer";
import { parseConnectionUrl } from "nodemailer/lib/shared/index.js";
import { render } from "@react-email/render";

import ProjectInvitationTemplate from "./ProjectInvitationEmailTemplate";

const langfuseUrls = {
  US: "https://us.cloud.langfuse.com",
  EU: "https://cloud.langfuse.com",
  STAGING: "https://staging.langfuse.com",
};

type SendProjectInvitationParams = {
  env: Partial<
    Record<
      | "EMAIL_FROM_ADDRESS"
      | "SMTP_CONNECTION_URL"
      | "NEXT_PUBLIC_LANGFUSE_CLOUD_REGION"
      | "NEXTAUTH_URL",
      string | undefined
    >
  >;
  to: string;
  inviterName: string;
  inviterEmail: string;
  orgName: string;
};

export const sendProjectInvitationEmail = async ({
  env,
  to,
  inviterName,
  inviterEmail,
  orgName,
}: SendProjectInvitationParams) => {
  if (!env.EMAIL_FROM_ADDRESS || !env.SMTP_CONNECTION_URL) {
    console.error(
      "Missing environment variables for sending project invitation email."
    );
    return;
  }

  const getAuthURL = () =>
    env.NEXT_PUBLIC_LANGFUSE_CLOUD_REGION === "US" ||
    env.NEXT_PUBLIC_LANGFUSE_CLOUD_REGION === "EU" ||
    env.NEXT_PUBLIC_LANGFUSE_CLOUD_REGION === "STAGING"
      ? langfuseUrls[env.NEXT_PUBLIC_LANGFUSE_CLOUD_REGION]
      : env.NEXTAUTH_URL;

  const authUrl = getAuthURL();
  if (!authUrl) {
    console.error(
      "Missing NEXTAUTH_URL or NEXT_PUBLIC_LANGFUSE_CLOUD_REGION environment variable."
    );
    return;
  }

  try {
    const mailer = createTransport(parseConnectionUrl(env.SMTP_CONNECTION_URL));

    const htmlTemplate = render(
      ProjectInvitationTemplate({
        invitedByUsername: inviterName,
        invitedByUserEmail: inviterEmail,
        orgName: orgName,
        recieverEmail: to,
        inviteLink: authUrl,
        emailFromAddress: env.EMAIL_FROM_ADDRESS,
        langfuseCloudRegion: env.NEXT_PUBLIC_LANGFUSE_CLOUD_REGION,
      })
    );

    await mailer.sendMail({
      to,
      from: `Langfuse <${env.EMAIL_FROM_ADDRESS}>`,
      subject: `${inviterName} invited you to join "${orgName}" organization on Langfuse`,
      html: htmlTemplate,
    });
  } catch (error) {
    console.error(error);
  }
};

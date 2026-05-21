import { google } from "googleapis";

export const getOAuthClient = (
  accessToken: string,
  refreshToken: string
) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return oauth2Client;
};

export const getCalendarClient = (
  oauth2Client: InstanceType<typeof google.auth.OAuth2>
) => {
  return google.calendar({
    version: "v3",
    auth: oauth2Client,
  });
};
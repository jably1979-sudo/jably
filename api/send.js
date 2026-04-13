import jwt from "jsonwebtoken";

export default async function handler(req, res) {

  const key = JSON.parse(process.env.FIREBASE_KEY);

  const now = Math.floor(Date.now() / 1000);

  const token = jwt.sign(
    {
      iss: key.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now
    },
    key.private_key,
    { algorithm: "RS256" }
  );

  const authRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${token}`
  });

  const { access_token } = await authRes.json();

  const body = req.body?.body || "更新されました";

  const message = {
    message: {
      topic: "all",
      notification: {
        title: "こころで聴くおはなし",
        body: body
      }
    }
  };

  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${key.project_id}/messages:send`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(message)
    }
  );

  const data = await response.json();
  res.status(200).json(data);
}

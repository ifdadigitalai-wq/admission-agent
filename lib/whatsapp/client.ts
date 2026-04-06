const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!;
const TOKEN = process.env.WHATSAPP_TOKEN!;
const API_URL = `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`;

export async function sendWhatsAppMessage(to: string, text: string) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    }),
  });

  const data = await res.json();
  if (!res.ok) console.error("WhatsApp send error:", data);
  return data;
}

export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  languageCode = "en_US",
  components: any[] = []
) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: templateName,
        language: { code: languageCode },
        components,
      },
    }),
  });

  const data = await res.json();
  if (!res.ok) console.error("WhatsApp template error:", data);
  return data;
}
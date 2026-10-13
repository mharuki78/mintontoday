import { publisher } from "@/lib/publisher";

export function GET() {
  const client = publisher.adsenseClient;
  return new Response(
    `google.com, ${client.replace("ca-", "")}, DIRECT, f08c47fec0942fa0\n`,
    { headers: { "Content-Type": "text/plain" } },
  );
}

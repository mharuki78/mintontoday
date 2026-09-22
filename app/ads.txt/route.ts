export function GET() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  if (!client || !/^ca-pub-\d{16}$/.test(client))
    return new Response("# AdSense is not enabled.\n", {
      headers: { "Content-Type": "text/plain" },
    });
  return new Response(
    `google.com, ${client.replace("ca-", "")}, DIRECT, f08c47fec0942fa0\n`,
    { headers: { "Content-Type": "text/plain" } },
  );
}

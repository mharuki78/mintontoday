import { createHmac, timingSafeEqual } from "node:crypto";
import { invalidatePublicArticles } from "@/lib/public-cache";

export async function POST(request: Request) {
  const secret = process.env.SESSION_SECRET;
  if(!secret) return Response.json({error:"Cache invalidation unavailable"}, {status:503});
  const time = request.headers.get("X-Editorial-Time") || "";
  const signature = request.headers.get("X-Editorial-Signature") || "";
  if(!/^\d{13}$/.test(time) || Math.abs(Date.now()-Number(time)) > 300000 || !/^[a-f0-9]{64}$/.test(signature))
    return Response.json({error:"Unauthorized"}, {status:401});
  const expected = createHmac("sha256",secret).update(time).digest();
  if(!timingSafeEqual(expected, Buffer.from(signature,"hex")))
    return Response.json({error:"Unauthorized"}, {status:401});
  invalidatePublicArticles();
  return Response.json({ok:true});
}

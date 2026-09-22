import { isAdmin } from "@/lib/auth";
import { isPublishedMedia, readMedia } from "@/lib/media-store";
export const runtime="nodejs";
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  if(!/^[a-f0-9]{32}$/.test(id))return new Response(null,{status:404});
  try{
    const published=await isPublishedMedia(id);
    if(!published&&!(await isAdmin()))return new Response(null,{status:404,headers:{"Cache-Control":"no-store"}});
    const image=await readMedia(id);if(!image)return new Response(null,{status:404});
    return new Response(new Uint8Array(Buffer.from(image.payload,"base64")),{
      headers:{"Content-Type":"image/webp","Content-Length":String(image.bytes),"X-Content-Type-Options":"nosniff",
      "Cache-Control":published?"public, max-age=60, s-maxage=60":"private, no-store",
      "Content-Disposition":`inline; filename="${id}.webp"`},
    });
  }catch{return new Response(null,{status:503,headers:{"Cache-Control":"no-store"}});}
}

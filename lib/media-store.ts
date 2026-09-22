import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { eq, sql } from "drizzle-orm";
import { getDatabase } from "./database";
import { media, articles } from "@/db/schema";
import { allArticles } from "./store";
const directory=path.join(process.env.CONTENT_DIR?path.resolve(/* turbopackIgnore: true */ process.env.CONTENT_DIR):path.join(process.cwd(),"data"),"media");
export async function storeMedia(image:{data:Buffer;width:number;height:number;bytes:number}){
  const id=randomBytes(16).toString("hex");
  const row={id,payload:image.data.toString("base64"),width:image.width,height:image.height,bytes:image.bytes,createdAt:Date.now()};
  const db=getDatabase();
  if(db)await db.insert(media).values(row);
  else{await mkdir(directory,{recursive:true});await writeFile(path.join(directory,id+".json"),JSON.stringify(row),{flag:"wx"});}
  return {id,url:`/api/media/${id}`,width:row.width,height:row.height};
}
export async function readMedia(id:string){
  if(!/^[a-f0-9]{32}$/.test(id))return null;
  const db=getDatabase();
  if(db)return (await db.select().from(media).where(eq(media.id,id)).limit(1))[0]||null;
  try{return JSON.parse(await readFile(path.join(directory,id+".json"),"utf8")) as typeof media.$inferSelect;}
  catch(error){if((error as NodeJS.ErrnoException).code==="ENOENT")return null;throw error;}
}
export async function isPublishedMedia(id:string){
  const url=`/api/media/${id}`;const db=getDatabase();
  if(db){
    const rows=await db.select({id:articles.id}).from(articles).where(sql`${articles.data}->>'status'='published' and coalesce(${articles.data}->>'sample','false')='false' and ${articles.data}->'images' @> ${JSON.stringify([{url}])}::jsonb`).limit(1);
    return rows.length>0;
  }
  return (await allArticles()).some(p=>p.status==="published"&&!p.sample&&p.images?.some(i=>i.url===url));
}

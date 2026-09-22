import { NextResponse } from "next/server";
import { isAdmin, sameOrigin } from "@/lib/auth";
import { readBody, BodyTooLarge } from "@/lib/request-body";
import { optimizeUpload, MAX_UPLOAD_BYTES } from "@/lib/upload-image";
import { storeMedia } from "@/lib/media-store";
export const runtime="nodejs";
const fail=(error:string,status:number)=>NextResponse.json({error},{status});
export async function POST(request:Request){
  if(!sameOrigin(request))return fail("잘못된 요청입니다.",403);
  if(!(await isAdmin()))return fail("로그인이 필요합니다.",401);
  if(!["image/jpeg","image/png","image/webp"].includes(request.headers.get("content-type")||""))
    return fail("JPG, PNG, WebP 사진을 선택해 주세요.",415);
  let image;
  try {image=await optimizeUpload(await readBody(request,MAX_UPLOAD_BYTES));}
  catch(error){return fail(error instanceof BodyTooLarge?"사진은 4MB 이하로 첨부해 주세요.":"사진을 읽을 수 없습니다. 4MB 이하 JPG, PNG, WebP 정지 이미지인지 확인해 주세요.",error instanceof BodyTooLarge?413:400);}
  try{return NextResponse.json(await storeMedia(image),{status:201,headers:{"Cache-Control":"no-store"}});}
  catch{return fail("사진 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.",503);}
}

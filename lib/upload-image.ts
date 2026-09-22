import sharp from "sharp";
export const MAX_UPLOAD_BYTES=4_000_000;
export const MAX_IMAGE_BYTES=1_000_000;
export async function optimizeUpload(input:Buffer){
  if(!input.length||input.length>MAX_UPLOAD_BYTES)throw new Error("사진은 4MB 이하로 첨부해 주세요.");
  const image=sharp(input,{limitInputPixels:40_000_000,animated:false});
  const metadata=await image.metadata();
  if(!["jpeg","png","webp"].includes(metadata.format||"") || (metadata.pages||1)>1)
    throw new Error("JPG, PNG, WebP 정지 이미지만 첨부할 수 있습니다.");
  // Decode and re-encode pixels; original metadata (including location) is removed.
  const {data,info}=await image.rotate().resize({width:1800,height:1800,fit:"inside",withoutEnlargement:true}).webp({quality:82}).toBuffer({resolveWithObject:true});
  if(data.length>MAX_IMAGE_BYTES)throw new Error("사진의 크기를 줄여 다시 첨부해 주세요.");
  return {data,width:info.width,height:info.height,bytes:data.length};
}

export class BodyTooLarge extends Error {}
export async function readBody(request:Request, limit:number):Promise<Buffer>{
  if(Number(request.headers.get("content-length")||0)>limit)throw new BodyTooLarge();
  const reader=request.body?.getReader();if(!reader)return Buffer.alloc(0);
  const chunks:Uint8Array[]=[];let bytes=0;
  while(true){
    const {done,value}=await reader.read();if(done)break;
    bytes+=value.byteLength;
    if(bytes>limit){await reader.cancel();throw new BodyTooLarge();}
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

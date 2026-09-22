import { z } from "zod";

export const fontFamilies = ["sans-serif", "serif", "monospace", "Arial", "Georgia"] as const;
export const imageUrlSchema = z.string().max(2000).refine(value =>
  /^\/images\/[a-zA-Z0-9/_.-]+$/.test(value) ||
  /^\/api\/media\/[a-f0-9]{32}$/.test(value) ||
  (() => { try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; } catch { return false; } })(),
  "안전한 이미지 주소가 필요합니다.");
export const linkUrlSchema = z.string().max(2000).refine(value => {
  try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password; } catch { return false; }
}, "http 또는 https 링크를 입력하세요.");
const color = z.string().regex(/^(#[0-9a-fA-F]{3,8}|rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\))$/);
const nullable = <T extends z.ZodTypeAny>(schema: T) => schema.nullish();
const markSchema = z.discriminatedUnion("type", [
  ...(["bold", "italic", "underline", "strike", "code"] as const).map(type => z.object({ type: z.literal(type) }).strict()) as [
    z.ZodObject<{type:z.ZodLiteral<"bold">}>, z.ZodObject<{type:z.ZodLiteral<"italic">}>,
    z.ZodObject<{type:z.ZodLiteral<"underline">}>, z.ZodObject<{type:z.ZodLiteral<"strike">}>, z.ZodObject<{type:z.ZodLiteral<"code">}>],
  z.object({type:z.literal("link"), attrs:z.object({href:linkUrlSchema, target:nullable(z.enum(["_blank","_self"])), rel:nullable(z.string().max(100)), class:nullable(z.string().max(100))}).strict()}).strict(),
  z.object({type:z.literal("textStyle"),attrs:z.object({
    color:nullable(color),backgroundColor:nullable(color),
    fontSize:nullable(z.string().regex(/^(?:[89]|[1-8][0-9]|9[0-6])px$/)),
    fontFamily:nullable(z.enum(fontFamilies)),
  }).strict()}).strict(),
]);
export type RichMark = z.infer<typeof markSchema>;
export type RichNode = {
  type: "doc"|"paragraph"|"heading"|"text"|"hardBreak"|"blockquote"|"bulletList"|"orderedList"|"listItem"|"horizontalRule"|"image";
  attrs?: {textAlign?: "left"|"center"|"right"|"justify"|null;level?:number;start?:number;type?:string|null;src?:string;alt?:string|null;title?:string|null;width?:string|null;height?:null};
  text?:string; marks?:RichMark[];content?:RichNode[];
};
const nodeSchema: z.ZodType<RichNode> = z.lazy(() => z.object({
  type:z.enum(["doc","paragraph","heading","text","hardBreak","blockquote","bulletList","orderedList","listItem","horizontalRule","image"]),
  attrs:z.object({textAlign:nullable(z.enum(["left","center","right","justify"])),level:z.number().int().min(2).max(3).optional(),start:z.number().int().min(1).max(10000).optional(),type:nullable(z.string().max(10)),src:imageUrlSchema.optional(),alt:nullable(z.string().max(300)),title:nullable(z.string().max(300)),width:nullable(z.enum(["25%","50%","75%","100%"])),height:z.null().optional()}).strict().optional(),
  text:z.string().max(60000).optional(), marks:z.array(markSchema).max(8).optional(),
  content:z.array(nodeSchema).max(4000).optional(),
}).strict());

// Bound depth and node count before recursive parsing, including malicious input.
const boundedDocument = z.unknown().superRefine((value, ctx) => {
  const stack: {value:unknown;depth:number}[]=[{value,depth:0}];let count=0;
  while(stack.length){
    const item=stack.pop()!;
    if(++count>4000 || item.depth>16){ctx.addIssue({code:"custom",message:"본문 구조가 너무 큽니다.",fatal:true});return z.NEVER;}
    if(item.value && typeof item.value==="object" && Array.isArray((item.value as RichNode).content))
      for(const child of (item.value as RichNode).content!) stack.push({value:child,depth:item.depth+1});
  }
});
export const richDocumentSchema = boundedDocument.pipe(nodeSchema).superRefine((doc,ctx)=>{
  const fail=()=>ctx.addIssue({code:"custom",message:"지원하지 않는 본문 구조입니다."});
  if(doc.type!=="doc") return fail();
  const walk=(n:RichNode,parent?:RichNode)=>{
    const children=n.content||[];
    if(n.type==="doc" && parent) fail();
    if(n.type==="text" && (!n.text || children.length)) fail();
    if(n.type!=="text" && (n.text!==undefined || n.marks?.length)) fail();
    if(["hardBreak","horizontalRule","image"].includes(n.type) && children.length) fail();
    if(n.type==="heading" && !n.attrs?.level) fail();
    if(n.type==="image" && !n.attrs?.src) fail();
    if(["paragraph","heading"].includes(n.type) && children.some(c=>!["text","hardBreak"].includes(c.type))) fail();
    if(["bulletList","orderedList"].includes(n.type) && (!children.length || children.some(c=>c.type!=="listItem"))) fail();
    if(["doc","blockquote","listItem"].includes(n.type) && children.some(c=>["doc","text","hardBreak","listItem"].includes(c.type))) fail();
    children.forEach(c=>walk(c,n));
  };walk(doc);
  if(richText(doc).length>60000)ctx.addIssue({code:"custom",message:"본문은 60,000자까지 저장할 수 있습니다."});
});
export function richText(node: RichNode): string {
  if(node.type==="text") return node.text||"";
  if(node.type==="hardBreak") return "\n";
  if(node.type==="image"||node.type==="horizontalRule")return "";
  const inline=["paragraph","heading"].includes(node.type);
  const result=(node.content||[]).map(richText).join(inline?"":"\n\n");
  return node.type==="heading" ? "## "+result : result;
}
export function richImageUrls(node: RichNode): string[] {
  return [...(node.type==="image"&&node.attrs?.src?[node.attrs.src]:[]),...(node.content||[]).flatMap(richImageUrls)];
}
export function legacyDocument(body:string, images:{url:string;alt:string}[]=[]):RichNode {
  const paragraphs=body.split("\n\n");const content:RichNode[]=[];
  const textNodes=(text:string):RichNode[]=>text.split("\n").flatMap((line,i)=>[...(i?[{type:"hardBreak" as const}]:[]),...(line?[{type:"text" as const,text:line}]:[])]);
  const imageNode=(img:{url:string;alt:string}):RichNode=>({type:"image",attrs:{src:img.url,alt:img.alt,width:"100%"}});
  paragraphs.forEach((p,i)=>{
    // Older automation sometimes put the heading and paragraph in one block.
    if(p.startsWith("## ")){
      const [title,...rest]=p.slice(3).split("\n");
      content.push({type:"heading",attrs:{level:2},content:textNodes(title)});
      if(rest.length)content.push({type:"paragraph",content:textNodes(rest.join("\n"))});
    }else content.push({type:"paragraph",content:textNodes(p)});
    if(i===0&&images[0])content.push(imageNode(images[0]));
    if(i===Math.max(1,Math.floor(paragraphs.length/2)))content.push(...images.slice(1).map(imageNode));
  });
  if(paragraphs.length===1)content.push(...images.slice(1).map(imageNode));
  return {type:"doc",content};
}

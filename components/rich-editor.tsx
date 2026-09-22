"use client";
import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle, Color, BackgroundColor, FontFamily, FontSize } from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import { Bold, Italic, Underline, Strikethrough, List, ListOrdered, Quote, AlignLeft, AlignCenter, AlignRight, Undo2, Redo2, ImagePlus, Link2, Unlink, RemoveFormatting } from "lucide-react";
import type { Article } from "@/lib/content";
import { fontFamilies, legacyDocument, linkUrlSchema, type RichNode } from "@/lib/rich-text";

const BlogImage=Image.extend({
  addAttributes(){return {...this.parent?.(),width:{default:"100%",parseHTML:element=>["25%","50%","75%","100%"].includes(element.getAttribute("width")||"")?element.getAttribute("width"):"100%",renderHTML:attrs=>({width:attrs.width,style:`width:${attrs.width};max-width:100%;height:auto;display:block;margin-inline:auto`})}};},
});
type Photo=NonNullable<Article["images"]>[number];
export function RichEditor({post,onChange,onPhoto,onBusyChange,disabled}:{post:Article;onChange:(document:RichNode)=>void;onPhoto:(photo:Photo)=>void;onBusyChange:(busy:boolean)=>void;disabled:boolean}){
  const [photoPanel,setPhotoPanel]=useState(false);
  const [linkPanel,setLinkPanel]=useState(false);
  const [link,setLink]=useState("");
  const [alt,setAlt]=useState("");
  const [credit,setCredit]=useState("Minton Today");
  const [caption,setCaption]=useState("");
  const [rights,setRights]=useState(false);
  const [uploading,setUploading]=useState(false);
  const [notice,setNotice]=useState("");
  const latest=useRef({onChange,onPhoto,onBusyChange});
  latest.current={onChange,onPhoto,onBusyChange};
  const editor=useEditor({
    immediatelyRender:false,shouldRerenderOnTransaction:true,
    extensions:[StarterKit.configure({heading:{levels:[2,3]},codeBlock:false,link:{openOnClick:false,autolink:false,linkOnPaste:false}}),TextStyle,Color,BackgroundColor,FontFamily,FontSize,TextAlign.configure({types:["heading","paragraph"]}),BlogImage.configure({allowBase64:false})],
    content:post.bodyDocument||legacyDocument(post.body,post.images),
    editorProps:{attributes:{"aria-label":"본문 편집기",role:"textbox","aria-multiline":"true",class:"rich-prose editor-canvas"},
      handlePaste:(_view,event)=>{if(event.clipboardData?.files.length || /<img\b/i.test(event.clipboardData?.getData("text/html")||"")){setNotice("사진 첨부 버튼으로 파일과 출처를 등록해 주세요. 사진이 포함된 복사 내용은 텍스트로 붙여넣을 수 있습니다.");return true;}return false;},
      handleDrop:(_view,event)=>{if(event.dataTransfer?.files.length){setNotice("사진 첨부 버튼으로 파일과 출처를 등록해 주세요.");return true;}return false;}},
    onUpdate:({editor})=>latest.current.onChange(editor.getJSON() as RichNode),
  });
  useEffect(()=>{editor?.setEditable(!disabled&&!uploading,false);},[editor,disabled,uploading]);
  useEffect(()=>{
    if(editor&&post.bodyDocument&&JSON.stringify(editor.getJSON())!==JSON.stringify(post.bodyDocument))
      editor.commands.setContent(post.bodyDocument,{emitUpdate:false});
  },[editor,post.bodyDocument]);
  if(!editor)return <div className="rich-editor-loading">편집기를 준비하고 있습니다…</div>;
  const button=(label:string,Icon:typeof Bold,run:()=>void,active=false)=> <button type="button" title={label} aria-label={label} aria-pressed={active} disabled={disabled||uploading} onMouseDown={e=>e.preventDefault()} onClick={run}><Icon size={17}/></button>;
  async function upload(file:File){
    if(!editor||uploading)return;
    if(!rights||alt.trim().length<3||!credit.trim()){setNotice("사진 설명(3자 이상), 제공처, 사용 권한을 먼저 확인해 주세요.");return;}
    if((post.images?.length||0)>=12){setNotice("한 글에는 사진을 12장까지 등록할 수 있습니다.");return;}
    if(file.size>4_000_000){setNotice("사진은 4MB 이하로 첨부해 주세요.");return;}
    setUploading(true);latest.current.onBusyChange(true);setNotice("사진을 최적화해 저장하고 있습니다…");
    try{
      const response=await fetch("/api/admin/media",{method:"POST",headers:{"Content-Type":file.type},body:file});
      const data=await response.json();if(!response.ok)throw new Error(data.error||"사진 첨부에 실패했습니다.");
      const photo:Photo={url:data.url,alt:alt.trim(),caption:caption.trim(),credit:credit.trim(),sourceUrl:new URL(data.url,window.location.protocol==="https:"?window.location.origin:"https://mintontoday.com").href,rights:"운영자가 직접 촬영했거나 게시 권한을 보유함을 확인하고 업로드했습니다.",kind:"photo"};
      latest.current.onPhoto(photo);
      editor.chain().focus().setImage({src:data.url,alt:photo.alt}).run();
      setNotice("사진을 본문에 넣었습니다. 글을 저장하면 함께 반영됩니다.");setPhotoPanel(false);setAlt("");setCaption("");setRights(false);
    }catch(error){setNotice(error instanceof Error?error.message:"사진 첨부에 실패했습니다.");}
    finally{setUploading(false);latest.current.onBusyChange(false);}
  }
  return <div className="rich-editor">
    <div className="editor-toolbar" role="group" aria-label="본문 서식 도구">
      <label>문단<select aria-label="문단 스타일" disabled={disabled||uploading} value={editor.isActive("heading",{level:2})?"2":editor.isActive("heading",{level:3})?"3":"p"} onChange={e=>e.target.value==="p"?editor.chain().focus().setParagraph().run():editor.chain().focus().toggleHeading({level:Number(e.target.value) as 2|3}).run()}><option value="p">본문</option><option value="2">큰 소제목</option><option value="3">작은 소제목</option></select></label>
      <label>글꼴<select aria-label="글꼴" disabled={disabled||uploading} value={editor.getAttributes("textStyle").fontFamily||"sans-serif"} onChange={e=>editor.chain().focus().setFontFamily(e.target.value).run()}>{fontFamilies.map((f,i)=><option key={f} value={f}>{["기본 고딕","명조","고정폭","Arial","Georgia"][i]}</option>)}</select></label>
      <label>크기<select aria-label="글자 크기" disabled={disabled||uploading} value={editor.getAttributes("textStyle").fontSize||""} onChange={e=>e.target.value?editor.chain().focus().setFontSize(e.target.value).run():editor.chain().focus().unsetFontSize().run()}><option value="">기본</option>{[12,14,16,18,20,24,28,32,40,48,64,72].map(n=><option key={n} value={n+"px"}>{n}</option>)}</select></label>
      <label className="editor-color">글자색<input aria-label="글자 색상" type="color" disabled={disabled||uploading} defaultValue="#19476a" onInput={e=>editor.chain().focus().setColor(e.currentTarget.value).run()}/></label>
      <label className="editor-color">배경색<input aria-label="글자 배경색" type="color" disabled={disabled||uploading} defaultValue="#e0f2da" onInput={e=>editor.chain().focus().setBackgroundColor(e.currentTarget.value).run()}/></label>
      {button("굵게",Bold,()=>editor.chain().focus().toggleBold().run(),editor.isActive("bold"))}
      {button("기울임",Italic,()=>editor.chain().focus().toggleItalic().run(),editor.isActive("italic"))}
      {button("밑줄",Underline,()=>editor.chain().focus().toggleUnderline().run(),editor.isActive("underline"))}
      {button("취소선",Strikethrough,()=>editor.chain().focus().toggleStrike().run(),editor.isActive("strike"))}
      {button("글머리 목록",List,()=>editor.chain().focus().toggleBulletList().run(),editor.isActive("bulletList"))}
      {button("번호 목록",ListOrdered,()=>editor.chain().focus().toggleOrderedList().run(),editor.isActive("orderedList"))}
      {button("인용문",Quote,()=>editor.chain().focus().toggleBlockquote().run(),editor.isActive("blockquote"))}
      {button("왼쪽 정렬",AlignLeft,()=>editor.chain().focus().setTextAlign("left").run(),editor.isActive({textAlign:"left"}))}
      {button("가운데 정렬",AlignCenter,()=>editor.chain().focus().setTextAlign("center").run(),editor.isActive({textAlign:"center"}))}
      {button("오른쪽 정렬",AlignRight,()=>editor.chain().focus().setTextAlign("right").run(),editor.isActive({textAlign:"right"}))}
      {button("링크 추가",Link2,()=>{setLink(editor.getAttributes("link").href||"");setLinkPanel(v=>!v);},editor.isActive("link"))}
      {button("링크 제거",Unlink,()=>editor.chain().focus().unsetLink().run())}
      {button("서식 지우기",RemoveFormatting,()=>editor.chain().focus().unsetAllMarks().clearNodes().unsetTextAlign().run())}
      {button("실행 취소",Undo2,()=>editor.chain().focus().undo().run())}
      {button("다시 실행",Redo2,()=>editor.chain().focus().redo().run())}
      <button type="button" className="editor-photo-button" disabled={disabled||uploading} aria-expanded={photoPanel} onClick={()=>setPhotoPanel(v=>!v)}><ImagePlus size={17}/> 사진 첨부</button>
    </div>
    {linkPanel&&<div className="editor-insert-panel"><label className="form-field">연결할 주소<input type="url" value={link} placeholder="https://" onChange={e=>setLink(e.target.value)}/></label><button type="button" className="secondary-button" onClick={()=>{const parsed=linkUrlSchema.safeParse(link);if(!parsed.success){setNotice("http 또는 https 주소를 입력해 주세요.");return;}const chain=editor.chain().focus().extendMarkRange("link");if(editor.state.selection.empty&&!editor.isActive("link"))chain.insertContent({type:"text",text:link,marks:[{type:"link",attrs:{href:link}}]}).run();else chain.setLink({href:link}).run();setLinkPanel(false);}}>링크 적용</button></div>}
    {photoPanel&&<div className="editor-insert-panel">
      <h3>내 사진을 본문에 첨부</h3><p>JPG · PNG · WebP, 한 장당 4MB 이하. 사진은 웹용으로 최적화됩니다.</p>
      <label className="form-field">사진 설명 (필수)<input maxLength={300} value={alt} onChange={e=>setAlt(e.target.value)} placeholder="예: 동호회 복식 연습 중인 모습"/></label>
      <label className="form-field">촬영자·제공처<input maxLength={200} value={credit} onChange={e=>setCredit(e.target.value)}/></label>
      <label className="form-field">사진 아래 설명<input maxLength={500} value={caption} onChange={e=>setCaption(e.target.value)}/></label>
      <label className="check-row"><input type="checkbox" checked={rights} onChange={e=>setRights(e.target.checked)}/>직접 촬영했거나 게시할 권한이 있는 사진입니다.</label>
      <label className="form-field">사진 파일 선택<input aria-label="사진 파일 선택" type="file" accept="image/jpeg,image/png,image/webp" disabled={disabled||uploading||!rights||alt.trim().length<3||!credit.trim()} onChange={e=>{const file=e.target.files?.[0];if(file)void upload(file);e.target.value="";}}/></label>
      <p>아직 발행하지 않은 첨부 사진은 로그인한 운영자만 볼 수 있습니다.</p>
      {!!post.images?.length&&<div className="editor-existing-photos"><strong>이미 등록된 사진 넣기</strong>{post.images.map((image,i)=><button type="button" key={image.url+i} disabled={disabled||uploading} onClick={()=>{editor.chain().focus().setImage({src:image.url,alt:image.alt}).run();setPhotoPanel(false);}}><img src={image.url} alt=""/><span>{image.alt}</span></button>)}</div>}
    </div>}
    {editor.isActive("image")&&<div className="editor-image-tools"><span>선택한 사진 크기</span>{["25%","50%","75%","100%"].map(width=><button type="button" key={width} onMouseDown={e=>e.preventDefault()} onClick={()=>editor.chain().focus().updateAttributes("image",{width}).run()}>{width}</button>)}<button type="button" onClick={()=>editor.chain().focus().deleteSelection().run()}>본문에서 빼기</button></div>}
    <EditorContent editor={editor}/>
    <div className="editor-help">글자를 선택한 뒤 서식을 바꾸세요. 사진은 커서 위치에 들어가며, 클릭해서 크기를 바꿀 수 있습니다.</div>
    {notice&&<p className="editor-notice" role="status">{notice}</p>}
  </div>;
}

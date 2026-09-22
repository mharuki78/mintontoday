import { Fragment, type CSSProperties, type ReactNode } from "react";
import type { Article } from "@/lib/content";
import type { RichNode } from "@/lib/rich-text";
import { ArticleImage } from "./article-image";

// Only typed, validated nodes become React elements. No saved HTML is executed.
export function RichContent({ document, images }: {document:RichNode;images:Article["images"]}) {
  let heading=0;
  function render(node:RichNode, key:number):ReactNode {
    const children=node.content?.map(render);
    const align:CSSProperties={textAlign:node.attrs?.textAlign||undefined};
    if(node.type==="text"){
      let text:ReactNode=node.text;
      for(const mark of node.marks||[]){
        if(mark.type==="bold")text=<strong>{text}</strong>;
        if(mark.type==="italic")text=<em>{text}</em>;
        if(mark.type==="underline")text=<u>{text}</u>;
        if(mark.type==="strike")text=<s>{text}</s>;
        if(mark.type==="code")text=<code>{text}</code>;
        if(mark.type==="link")text=<a href={mark.attrs.href} target="_blank" rel="noopener noreferrer">{text}</a>;
        if(mark.type==="textStyle")text=<span style={{color:mark.attrs.color||undefined,backgroundColor:mark.attrs.backgroundColor||undefined,fontSize:mark.attrs.fontSize||undefined,fontFamily:mark.attrs.fontFamily||undefined}}>{text}</span>;
      }
      return <Fragment key={key}>{text}</Fragment>;
    }
    switch(node.type){
      case "paragraph": return <p key={key} style={align}>{children?.length?children:<br/>}</p>;
      case "heading": {const id=`section-${heading++}`;return node.attrs?.level===3?<h3 key={key} id={id} style={align}>{children}</h3>:<h2 key={key} id={id} style={align}>{children}</h2>;}
      case "bulletList":return <ul key={key}>{children}</ul>;
      case "orderedList":return <ol key={key} start={node.attrs?.start}>{children}</ol>;
      case "listItem":return <li key={key}>{children}</li>;
      case "blockquote":return <blockquote key={key}>{children}</blockquote>;
      case "hardBreak":return <br key={key}/>;
      case "horizontalRule":return <hr key={key}/>;
      case "image": {const image=images?.find(i=>i.url===node.attrs?.src);return image?<ArticleImage key={key} image={image} width={node.attrs?.width}/>:null;}
      default:return <Fragment key={key}>{children}</Fragment>;
    }
  }
  return <div className="prose rich-prose">{document.content?.map(render)}</div>;
}

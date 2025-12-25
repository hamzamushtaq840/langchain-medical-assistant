import ReactMarkdown from "react-markdown";

import React from "react";

export const markdownComponents = {
  // Paragraphs: Relaxed leading for medical/technical readability
  p: ({ children }: { children?: React.ReactNode }) => (
    <p
      className="font-sans text-[15px] leading-[1.7] tracking-wide"
      style={{ color: "#E4E4E7" }}
    >
      {children}
    </p>
  ),

  // Headings: Necessary for the "###" format in your data
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3
      className="mt-5 mb-2 font-sans text-lg font-bold tracking-tight"
      style={{ color: "#FFFFFF" }}
    >
      {children}
    </h3>
  ),

  // Lists: Increased spacing to handle multi-line bullets
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul
      className="mb-3 ml-5 list-disc text-[15px] leading-relaxed"
      style={{ color: "#D4D4D8" }}
    >
      {children}
    </ul>
  ),

  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="pl-2 leading-relaxed" style={{ color: "#D4D4D8" }}>
      {children}
    </li>
  ),

  // Emphasis/Italic: LLMs use this for scientific names like "C. difficile"
  em: ({ children }: { children?: React.ReactNode }) => (
    <em className="italic" style={{ color: "#A1A1AA" }}>
      {children}
    </em>
  ),

  // Strong/Bold: High contrast for key terms like "Diarrhea:"
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-bold tracking-tight" style={{ color: "#FFFFFF" }}>
      {children}
    </strong>
  ),

  // Inline Code: In case any technical terms are wrapped in backticks
  code: ({ children }: { children?: React.ReactNode }) => (
    <code
      className="rounded border border-[#3F3F46] px-1.5 py-0.5 font-mono text-[13px]"
      style={{ backgroundColor: "#18181B", color: "#F4F4F5" }}
    >
      {children}
    </code>
  ),
};

const Markdown = ({ content }: { content: string }) => {
  return (
    <div>
      <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
    </div>
  );
};

export default Markdown;
//   <Markdown content={msg.content} />;

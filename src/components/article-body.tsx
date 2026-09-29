import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function ArticleBody({ body }: { body: string }) {
  return <div className="article-body"><ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown></div>;
}

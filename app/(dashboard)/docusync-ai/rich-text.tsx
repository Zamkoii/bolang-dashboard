import type { ReactNode } from "react";

function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);

  return parts.map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    if (/^\*[^*]+\*$/.test(part)) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    if (/^`[^`]+`$/.test(part)) {
      return (
        <code
          key={i}
          className="rounded bg-black/[0.07] px-1 py-0.5 font-mono text-[12px]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

type Block =
  | { kind: "para"; items: string[] }
  | { kind: "list"; items: string[]; ordered: boolean };

export function RichText({ text, className }: { text: string; className?: string }) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");

  const blocks: Block[] = [];
  let buffer: string[] | null = null;
  let ordered = false;

  const flush = () => {
    if (buffer) {
      blocks.push({ kind: "list", items: buffer, ordered });
      buffer = null;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === "") {
      flush();
      continue;
    }

    const bullet = trimmed.match(/^[-•*]\s+(.*)$/);
    const numbered = trimmed.match(/^\d+[.)]\s+(.*)$/);

    if (bullet) {
      if (!buffer || ordered) flush();
      ordered = false;
      buffer = buffer ?? [];
      buffer.push(bullet[1]);
      continue;
    }

    if (numbered) {
      if (!buffer || !ordered) flush();
      ordered = true;
      buffer = buffer ?? [];
      buffer.push(numbered[1]);
      continue;
    }

    flush();
    blocks.push({ kind: "para", items: [trimmed] });
  }
  flush();

  return (
    <div className={className}>
      {blocks.map((block, i) =>
        block.kind === "para" ? (
          <p key={i}>{renderInline(block.items[0])}</p>
        ) : block.ordered ? (
          <ol key={i} className="ml-4 list-decimal space-y-1">
            {block.items.map((item, j) => (
              <li key={j}>{renderInline(item)}</li>
            ))}
          </ol>
        ) : (
          <ul key={i} className="ml-4 list-disc space-y-1">
            {block.items.map((item, j) => (
              <li key={j}>{renderInline(item)}</li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}
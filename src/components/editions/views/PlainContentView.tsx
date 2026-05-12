export function PlainContentView({ content }: { content: string }) {
  if (!content)
    return (
      <p className="text-sm text-muted-foreground italic">No content.</p>
    );
  return (
    <div className="rounded-md border bg-card p-4 max-h-[600px] overflow-y-auto">
      <pre className="whitespace-pre-wrap leading-loose text-base">
        {content}
      </pre>
    </div>
  );
}

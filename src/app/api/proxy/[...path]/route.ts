import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
  "accept-encoding",
  "cookie",
]);

async function handle(
  request: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const base = process.env.OPENPECHA_API_BASE;
  const apiKey = request.headers.get("X-API-Key")?.trim();

  if (!base) {
    return Response.json(
      { error: "OPENPECHA_API_BASE is not set" },
      { status: 500 },
    );
  }
  if (!apiKey) {
    return Response.json(
      { error: "Enter an API key to read or write data." },
      { status: 401 },
    );
  }

  const { path } = await ctx.params;
  const upstreamUrl = new URL(
    path.join("/"),
    base.endsWith("/") ? base : base + "/",
  );
  for (const [k, v] of request.nextUrl.searchParams) {
    upstreamUrl.searchParams.append(k, v);
  }

  const headers = new Headers();
  for (const [name, value] of request.headers) {
    if (!HOP_BY_HOP.has(name.toLowerCase())) headers.set(name, value);
  }
  headers.set("X-API-Key", apiKey);
  if (
    !headers.has("X-Application") &&
    process.env.OPENPECHA_DEFAULT_APPLICATION
  ) {
    headers.set("X-Application", process.env.OPENPECHA_DEFAULT_APPLICATION);
  }

  const method = request.method.toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";
  const body = hasBody ? await request.arrayBuffer() : undefined;

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, {
      method,
      headers,
      body: body && body.byteLength > 0 ? body : undefined,
      cache: "no-store",
      redirect: "manual",
    });
  } catch (err) {
    return Response.json(
      {
        error: "Upstream request failed",
        detail: err instanceof Error ? err.message : String(err),
        url: upstreamUrl.toString(),
      },
      { status: 502 },
    );
  }

  const respHeaders = new Headers();
  for (const [name, value] of upstream.headers) {
    if (!HOP_BY_HOP.has(name.toLowerCase())) respHeaders.set(name, value);
  }
  respHeaders.delete("content-encoding");

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: respHeaders,
  });
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;

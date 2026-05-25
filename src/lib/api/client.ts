import type { components } from "./types";

export type Schemas = components["schemas"];
export type LocalizedString = Schemas["LocalizedString"];
export type TextInput = Schemas["TextInput"];
export type TextOutput = Schemas["TextOutput"];
export type TextPatch = Schemas["TextPatch"];
export type EditionInput = Schemas["EditionInput"];
export type EditionOutput = Schemas["EditionOutput"];
export type EditionRequestModel = Schemas["EditionRequestModel"];
export type EditionType = Schemas["EditionType"];
export type PersonInput = Schemas["PersonInput"];
export type PersonOutput = Schemas["PersonOutput"];
export type PersonPatch = Schemas["PersonPatch"];
export type CategoryInput = Schemas["CategoryInput"];
export type CategoryOutput = Schemas["CategoryOutput"];
export type TagInput = Schemas["TagInput"];
export type TagOutput = Schemas["TagOutput"];
export type LanguageCreateRequest = Schemas["LanguageCreateRequest"];
export type LanguageResponse = Schemas["LanguageResponse"];
export type ApplicationCreateRequest = Schemas["ApplicationCreateRequest"];
export type ApplicationResponse = Schemas["ApplicationResponse"];
export type ContributionInput = Schemas["ContributionInput"];
export type ContributionOutput = Schemas["ContributionOutput"];
export type AIContribution = Schemas["AIContribution"];
export type ContributorRole = Schemas["ContributorRole"];
export type LicenseType = Schemas["LicenseType"];
export type SegmentationInput = Schemas["SegmentationInput"];
export type SegmentationOutput = Schemas["SegmentationOutput"];
export type SegmentInput = Schemas["SegmentInput"];
export type SegmentOutput = Schemas["SegmentOutput"];
export type AlignmentInput = Schemas["AlignmentInput"];
export type AlignmentOutput = Schemas["AlignmentOutput"];
export type PaginationInput = Schemas["PaginationInput"];
export type PaginationOutput = Schemas["PaginationOutput"];
export type BibliographicMetadataInput = Schemas["BibliographicMetadataInput"];
export type BibliographicMetadataOutput =
  Schemas["BibliographicMetadataOutput"];
export type NoteInput = Schemas["NoteInput"];
export type NoteOutput = Schemas["NoteOutput"];
export type ContentOperation = Schemas["ContentOperation"];
export type IdResponse = Schemas["IdResponse"];
export type SearchResponse = Schemas["SearchResponse"];
export type Span = Schemas["Span"];
export type AnnotationMetadata = Schemas["AnnotationMetadata"];

export type Paginated<T> = {
  items: T[];
  has_more: boolean;
  offset: number;
  limit: number;
};

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

const APPLICATION_HEADER_KEY = "openpecha:x-application";
const API_KEY_STORAGE_KEY = "openpecha:x-api-key";
export const API_KEY_CHANGED_EVENT = "openpecha:api-key-changed";
export const DEFAULT_APPLICATION_ID = "webuddhist";

export function setApplicationId(id: string | null) {
  if (typeof window === "undefined") return;
  if (id) localStorage.setItem(APPLICATION_HEADER_KEY, id);
  else localStorage.removeItem(APPLICATION_HEADER_KEY);
  window.dispatchEvent(new Event("openpecha:app-changed"));
}

export function getApplicationId(): string {
  if (typeof window === "undefined") return DEFAULT_APPLICATION_ID;
  return (
    localStorage.getItem(APPLICATION_HEADER_KEY) ?? DEFAULT_APPLICATION_ID
  );
}

export function setApiKey(apiKey: string | null) {
  if (typeof window === "undefined") return;
  const value = apiKey?.trim();
  if (value) localStorage.setItem(API_KEY_STORAGE_KEY, value);
  else localStorage.removeItem(API_KEY_STORAGE_KEY);
  window.dispatchEvent(new Event(API_KEY_CHANGED_EVENT));
}

export function getApiKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(API_KEY_STORAGE_KEY) ?? "";
}

function hasHeader(headers: Record<string, string>, key: string): boolean {
  const lowerKey = key.toLowerCase();
  return Object.keys(headers).some((name) => name.toLowerCase() === lowerKey);
}

function buildUrl(
  path: string,
  query?: Record<string, unknown>,
): string {
  const clean = path.startsWith("/") ? path.slice(1) : path;
  const url = new URL(`/api/proxy/${clean}`, "http://placeholder");
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null || v === "") continue;
      if (Array.isArray(v)) {
        for (const item of v) {
          if (item !== undefined && item !== null && item !== "")
            url.searchParams.append(k, String(item));
        }
      } else {
        url.searchParams.set(k, String(v));
      }
    }
  }
  return url.pathname + (url.search ? url.search : "");
}

async function request<T>(
  method: string,
  path: string,
  options: {
    query?: Record<string, unknown>;
    body?: unknown;
    headers?: Record<string, string>;
    expectJson?: boolean;
  } = {},
): Promise<T> {
  const url = buildUrl(path, options.query);
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers ?? {}),
  };

  const appId = getApplicationId();
  if (appId && !headers["X-Application"]) {
    headers["X-Application"] = appId;
  }

  const apiKey = getApiKey().trim();
  if (!apiKey && !hasHeader(headers, "X-API-Key")) {
    throw new ApiError(
      401,
      "Enter an API key to read or write data.",
      null,
    );
  }
  if (apiKey && !hasHeader(headers, "X-API-Key")) {
    headers["X-API-Key"] = apiKey;
  }

  let body: BodyInit | undefined;
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  const resp = await fetch(url, { method, headers, body });

  if (!resp.ok) {
    let parsed: unknown;
    const text = await resp.text();
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = text;
    }
    const detail = extractErrorMessage(parsed) ?? resp.statusText;
    throw new ApiError(resp.status, detail, parsed);
  }

  if (resp.status === 204) return undefined as T;

  const expectJson = options.expectJson ?? true;
  if (!expectJson) return (await resp.text()) as unknown as T;

  const text = await resp.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

function extractErrorMessage(body: unknown): string | undefined {
  if (!body) return undefined;
  if (typeof body === "string") return body;
  if (typeof body === "object" && body !== null) {
    const obj = body as Record<string, unknown>;
    if (typeof obj.detail === "string") return obj.detail;
    if (Array.isArray(obj.detail)) {
      return obj.detail
        .map((d) => {
          if (typeof d === "object" && d !== null) {
            const dd = d as Record<string, unknown>;
            const loc = Array.isArray(dd.loc) ? dd.loc.join(".") : "";
            return [loc, dd.msg].filter(Boolean).join(": ");
          }
          return String(d);
        })
        .join("; ");
    }
    if (typeof obj.message === "string") return obj.message;
    if (typeof obj.error === "string") return obj.error;
  }
  return undefined;
}

export const api = {
  get: <T>(
    path: string,
    query?: Record<string, unknown>,
    headers?: Record<string, string>,
  ) => request<T>("GET", path, { query, headers }),
  post: <T>(
    path: string,
    body?: unknown,
    query?: Record<string, unknown>,
    headers?: Record<string, string>,
  ) => request<T>("POST", path, { body, query, headers }),
  patch: <T>(
    path: string,
    body?: unknown,
    query?: Record<string, unknown>,
    headers?: Record<string, string>,
  ) => request<T>("PATCH", path, { body, query, headers }),
  put: <T>(
    path: string,
    body?: unknown,
    query?: Record<string, unknown>,
    headers?: Record<string, string>,
  ) => request<T>("PUT", path, { body, query, headers }),
  delete: <T = void>(
    path: string,
    query?: Record<string, unknown>,
    headers?: Record<string, string>,
  ) => request<T>("DELETE", path, { query, headers }),
};

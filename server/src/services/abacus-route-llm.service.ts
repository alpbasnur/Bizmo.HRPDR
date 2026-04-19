import axios from "axios";

const DEFAULT_BASE =
  process.env["ABACUS_REST_BASE_URL"] ?? "https://api.abacus.ai";

export interface AbacusModelOptionDto {
  id: string;
  label: string;
  description: string;
}

/**
 * Abacus.AI RouteLLM — resmi REST: GET /api/v0/listRouteLLMModels (apiKey header).
 * @see abacusai Python client `list_route_llm_models`
 */
export async function fetchAbacusRouteLLMModels(
  apiKey: string,
): Promise<AbacusModelOptionDto[]> {
  const base = DEFAULT_BASE.replace(/\/$/, "");
  const url = `${base}/api/v0/listRouteLLMModels`;

  let data: {
    success?: boolean;
    result?: unknown;
    error?: string;
  };

  try {
    const res = await axios.get(url, {
      headers: {
        apiKey,
        "User-Agent": "Bizmo-HRPDR/1.0 (ai-config)",
      },
      timeout: 45_000,
      validateStatus: () => true,
    });

    if (res.status !== 200) {
      const msg =
        (res.data as { error?: string })?.error ??
        `HTTP ${res.status}`;
      throw new Error(msg);
    }

    data = res.data as typeof data;
  } catch (e) {
    if (axios.isAxiosError(e)) {
      const msg =
        (e.response?.data as { error?: string })?.error ??
        e.message;
      throw new Error(msg);
    }
    throw e;
  }

  if (!data.success) {
    throw new Error(data.error ?? "Abacus API başarısız yanıt");
  }

  const raw = data.result;
  const arr = Array.isArray(raw) ? raw : [];
  const out: AbacusModelOptionDto[] = [];

  for (const item of arr) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const nameRaw =
      [o.name, o.modelName, o.model, o.id, o.modelId].find(
        (v) => typeof v === "string" && String(v).trim(),
      ) ?? "";
    const name = String(nameRaw).trim();
    if (!name) continue;

    const descBits: string[] = [];
    if (typeof o.description === "string" && o.description.trim()) {
      descBits.push(o.description.trim());
    }
    if (typeof o.displayName === "string" && o.displayName !== name) {
      descBits.push(o.displayName);
    }
    if (typeof o.provider === "string") {
      descBits.push(o.provider);
    }
    const description =
      descBits.length > 0 ? descBits.join(" · ") : "Abacus RouteLLM";

    out.push({ id: name, label: name, description });
  }

  return out;
}

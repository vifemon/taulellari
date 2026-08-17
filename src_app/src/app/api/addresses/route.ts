import { searchMapboxAddresses } from "@/mapbox/geocoding";
import { API_ERROR_CODES } from "@/i18n/error-codes";
import { MAPBOX_LANGUAGES, normalizeLocale } from "@/i18n/config";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";
  const locale = normalizeLocale(searchParams.get("lang"));

  if (query.length < 1) {
    return Response.json({ suggestions: [] });
  }

  try {
    const suggestions = await searchMapboxAddresses(query, MAPBOX_LANGUAGES[locale]);
    return Response.json({ suggestions });
  } catch {
    return Response.json(
      { error: API_ERROR_CODES.addressSearchFailed },
      { status: 502 },
    );
  }
}

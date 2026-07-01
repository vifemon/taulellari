import { searchMapboxAddresses } from "@/mapbox/geocoding";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length < 1) {
    return Response.json({ suggestions: [] });
  }

  try {
    const suggestions = await searchMapboxAddresses(query);
    return Response.json({ suggestions });
  } catch {
    return Response.json(
      { error: "No se pudieron buscar direcciones" },
      { status: 502 },
    );
  }
}

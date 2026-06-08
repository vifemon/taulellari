import { getCurrentUser } from "@/auth/current-user";
import { searchMapboxAddresses } from "@/mapbox/geocoding";

export async function GET(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length < 3) {
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

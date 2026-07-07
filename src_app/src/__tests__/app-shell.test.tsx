import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppShell } from "../app/app-shell";

vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={alt} src={src} />;
  },
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("AppShell gallery search", () => {
  it("filters gallery images by title, description or metadata without calling address search", async () => {
    const fetchMock = mockAppShellFetch();

    render(<AppShell />);

    expect(await screen.findByText("Portal azul")).toBeDefined();
    expect(screen.getByText("Rosa verde")).toBeDefined();

    const search = screen.getByRole("searchbox", { name: "Buscar en la galeria" });
    fireEvent.change(search, { target: { value: "floral" } });

    await waitFor(() => {
      expect(screen.getByText("Portal azul")).toBeDefined();
      expect(screen.queryByText("Rosa verde")).toBeNull();
    });

    fireEvent.change(search, { target: { value: "cabanyal" } });

    await waitFor(() => {
      expect(screen.queryByText("Portal azul")).toBeNull();
      expect(screen.getByText("Rosa verde")).toBeDefined();
    });

    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining("/api/addresses"), expect.anything());
  });

  it("shows an empty search state when no images match", async () => {
    mockAppShellFetch();

    render(<AppShell />);

    await screen.findByText("Portal azul");

    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar en la galeria" }), {
      target: { value: "sin coincidencias" },
    });

    expect(await screen.findByText("No hay imagenes que coincidan con la busqueda.")).toBeDefined();
  });
});

function mockAppShellFetch() {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);

    if (url === "/api/auth/me") {
      return Response.json({
        user: {
          id: 1,
          email: "ana@example.com",
          nombre: "Ana",
          apellidos: "Soler",
        },
      });
    }

    if (url === "/api/publicaciones") {
      return Response.json({
        publicaciones: [
          {
            id: 1,
            titulo: "Portal azul",
            descripcion: "Motivo floral junto a la entrada",
            direccionTexto: "Carrer Major 12, Manises",
            latitud: 39.491,
            longitud: -0.461,
            creadoEn: "2026-07-01T10:00:00.000Z",
            isOwner: true,
            metadatos: { barrio: "Centro", color: "azul" },
            fotos: [{ index: 1, url: "/foto-portal-azul.jpg" }],
          },
          {
            id: 2,
            titulo: "Rosa verde",
            descripcion: "Pieza vegetal",
            direccionTexto: "Avinguda del Port 4, Valencia",
            latitud: 39.46,
            longitud: -0.34,
            creadoEn: "2026-07-02T10:00:00.000Z",
            isOwner: false,
            metadatos: { barrio: "Cabanyal", color: "verde" },
            fotos: [{ index: 1, url: "/foto-rosa-verde.jpg" }],
          },
        ],
      });
    }

    return Response.json({ error: "Unexpected request" }, { status: 404 });
  });

  vi.stubGlobal("fetch", fetchMock);

  return fetchMock;
}

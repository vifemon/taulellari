import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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

  it("switches between all publications and the current user's publications", async () => {
    mockAppShellFetch();

    render(<AppShell />);

    expect(await screen.findByText("Portal azul")).toBeDefined();
    expect(screen.getByText("Rosa verde")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Mis publicaciones" }));

    await waitFor(() => {
      expect(screen.getByText("Portal azul")).toBeDefined();
      expect(screen.queryByText("Rosa verde")).toBeNull();
    });

    fireEvent.click(screen.getByRole("button", { name: "Todas las publicaciones" }));

    expect(await screen.findByText("Rosa verde")).toBeDefined();
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

  it("opens publication details with owner actions after clicking an image", async () => {
    mockAppShellFetch();

    render(<AppShell />);

    fireEvent.click(await screen.findByRole("button", { name: "Ver detalles de Portal azul" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Ficha de la pieza")).toBeDefined();
    expect(within(dialog).getByText("Carrer Major 12, Manises")).toBeDefined();
    expect(within(dialog).getByRole("button", { name: "Editar" })).toBeDefined();
    expect(within(dialog).getByRole("button", { name: "Borrar" })).toBeDefined();
  });

  it("does not show owner actions for another user's publication", async () => {
    mockAppShellFetch();

    render(<AppShell />);

    fireEvent.click(await screen.findByRole("button", { name: "Ver detalles de Rosa verde" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Avinguda del Port 4, Valencia")).toBeDefined();
    expect(within(dialog).queryByRole("button", { name: "Editar" })).toBeNull();
    expect(within(dialog).queryByRole("button", { name: "Borrar" })).toBeNull();
  });

  it("renders every uploaded photo and navigates through the group", async () => {
    mockAppShellFetch({ multiplePhotos: true });

    render(<AppShell />);

    const imageButtons = await screen.findAllByRole("button", { name: "Ver detalles de Portal azul" });
    expect(imageButtons).toHaveLength(3);

    fireEvent.click(imageButtons[1]);

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("2 de 3")).toBeDefined();

    fireEvent.click(within(dialog).getByRole("button", { name: "Foto anterior" }));
    expect(within(dialog).getByText("1 de 3")).toBeDefined();

    fireEvent.click(within(dialog).getByRole("button", { name: "Foto siguiente" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Foto siguiente" }));
    expect(within(dialog).getByText("3 de 3")).toBeDefined();
    expect((within(dialog).getByRole("button", { name: "Foto siguiente" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows the group deletion confirmation for the last photo", async () => {
    mockAppShellFetch();

    render(<AppShell />);

    fireEvent.click(await screen.findByRole("button", { name: "Ver detalles de Portal azul" }));
    fireEvent.click(await screen.findByRole("button", { name: "Borrar" }));

    expect(
      await screen.findByText("¿Desea eliminar esta imagen? Es la última del grupo, por lo que también se eliminará la publicación."),
    ).toBeDefined();
  });

  it("confirms deleting only the current photo when a group has more images", async () => {
    mockAppShellFetch({ multiplePhotos: true });

    render(<AppShell />);

    fireEvent.click((await screen.findAllByRole("button", { name: "Ver detalles de Portal azul" }))[0]);
    fireEvent.click(await screen.findByRole("button", { name: "Borrar" }));

    expect(
      await screen.findByText("¿Desea eliminar esta imagen? Si es así se eliminará la imagen actual y se mantendrán el resto de imágenes del mismo grupo."),
    ).toBeDefined();
  });

  it("opens the login modal when an anonymous visitor clicks an image", async () => {
    mockAppShellFetch({ authenticated: false });

    render(<AppShell />);

    fireEvent.click(await screen.findByRole("button", { name: "Ver detalles de Portal azul" }));

    expect(await screen.findByRole("heading", { name: "Entra al archivo." })).toBeDefined();
  });

  it("opens the login modal when an anonymous visitor selects own publications", async () => {
    mockAppShellFetch({ authenticated: false });

    render(<AppShell />);

    fireEvent.click(await screen.findByRole("button", { name: "Mis publicaciones, iniciar sesion" }));

    expect(await screen.findByRole("heading", { name: "Entra al archivo." })).toBeDefined();
  });
});

function mockAppShellFetch({ authenticated = true, multiplePhotos = false } = {}) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);

    if (url === "/api/auth/me") {
      return Response.json({
        user: authenticated
          ? {
              id: 1,
              email: "ana@example.com",
              nombre: "Ana",
              apellidos: "Soler",
            }
          : null,
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
             fotos: multiplePhotos
               ? [
                   { id: 1, index: 1, url: "/foto-portal-azul-1.jpg" },
                   { id: 3, index: 2, url: "/foto-portal-azul-2.jpg" },
                   { id: 4, index: 3, url: "/foto-portal-azul-3.jpg" },
                 ]
               : [{ id: 1, index: 1, url: "/foto-portal-azul.jpg" }],
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
            fotos: [{ id: 2, index: 1, url: "/foto-rosa-verde.jpg" }],
          },
        ],
      });
    }

    return Response.json({ error: "Unexpected request" }, { status: 404 });
  });

  vi.stubGlobal("fetch", fetchMock);

  return fetchMock;
}

import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppStateProvider } from "../app-state/provider";
import {
  APP_PREFERENCES_COOKIE_NAME,
  DEFAULT_APP_PREFERENCES,
  type AppPreferences,
  parseAppPreferences,
} from "../app-state/preferences";
import { AppShell } from "../app/app-shell";
import type { AuthUser } from "../auth/types";
import { type Locale } from "../i18n/config";
import { AppI18nProvider } from "../i18n/provider";

const { refreshMock } = vi.hoisted(() => ({ refreshMock: vi.fn() }));
const AUTH_USER: AuthUser = {
  id: 1,
  email: "ana@example.com",
  nombre: "Ana",
  apellidos: "Soler",
};

vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={alt} src={src} />;
  },
}));

vi.mock("next/dynamic", async () => {
  const { useTranslation } = await import("react-i18next");

  return {
    default: () => function MockPublicationMap({
      onPublicationOpen,
      publications,
      theme,
    }: {
      onPublicationOpen: (publicationId: number) => void;
      publications: { id: number }[];
      theme: "light" | "dark";
    }) {
      const { t } = useTranslation();

      return (
        <section
          aria-label={t("map.label")}
          data-publication-ids={publications.map(({ id }) => id).join(",")}
          data-theme={theme}
        >
          {publications[0] ? (
            <button onClick={() => onPublicationOpen(publications[0].id)} type="button">
              Obrir el primer marcador
            </button>
          ) : null}
        </section>
      );
    },
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

afterEach(() => {
  cleanup();
  refreshMock.mockReset();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.cookie = "taulellari_locale=; Path=/; Max-Age=0";
  document.cookie = `${APP_PREFERENCES_COOKIE_NAME}=; Path=/; Max-Age=0`;
  document.documentElement.lang = "ca-ES-valencia";
});

function renderAppShell(
  locale: Locale = "val",
  {
    preferences = {},
    user = AUTH_USER,
  }: {
    preferences?: Partial<AppPreferences>;
    user?: AuthUser | null;
  } = {},
) {
  const initialPreferences = {
    ...DEFAULT_APP_PREFERENCES,
    ...preferences,
    locale,
  };

  return render(
    <AppI18nProvider initialLocale={locale}>
      <AppStateProvider initialPreferences={initialPreferences} initialUser={user}>
        <AppShell />
      </AppStateProvider>
    </AppI18nProvider>,
  );
}

describe("AppShell gallery search", () => {
  it("filters gallery images by title, description or metadata without calling address search", async () => {
    const fetchMock = mockAppShellFetch();

    renderAppShell();

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

    renderAppShell();

    expect(await screen.findByText("Portal azul")).toBeDefined();
    expect(screen.getByText("Rosa verde")).toBeDefined();
    expect(screen.getByText("Totes les publicacions")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Les meues publicacions" }));

    await waitFor(() => {
      expect(screen.getByText("Portal azul")).toBeDefined();
      expect(screen.queryByText("Rosa verde")).toBeNull();
    });
    expect(readStoredPreferences().galleryScope).toBe("mine");
    expect(screen.getByText("Les meues publicacions")).toBeDefined();
    expect(screen.queryByText("Totes les publicacions")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Totes les publicacions" }));

    expect(await screen.findByText("Rosa verde")).toBeDefined();
    expect(readStoredPreferences().galleryScope).toBe("all");
  });

  it("switches between gallery and map views", async () => {
    mockAppShellFetch();

    renderAppShell();

    expect(await screen.findByText("Portal azul")).toBeDefined();
    expect(screen.getByRole("link", { name: "Accedeix" })).toBeDefined();
    const activeGalleryButton = screen.getByRole("button", { name: "Vista de galeria" });
    expect(within(activeGalleryButton).getByText("Vista de galeria")).toBeDefined();
    expect(activeGalleryButton.querySelector("svg")).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Vista de mapa" }));

    const map = await screen.findByRole("region", { name: "Mapa de publicacions" });
    const activeMapButton = screen.getByRole("button", { name: "Vista de mapa" });
    expect(within(activeMapButton).getByText("Vista de mapa")).toBeDefined();
    expect(activeMapButton.querySelector("svg")).not.toBeNull();
    expect(screen.queryByText("Vista de galeria")).toBeNull();
    expect(map.getAttribute("data-theme")).toBe("dark");
    expect(screen.queryByText("Portal azul")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Activar el mode clar" }));
    expect(map.getAttribute("data-theme")).toBe("light");
    expect(readStoredPreferences()).toMatchObject({ galleryView: "map", theme: "light" });

    fireEvent.click(screen.getByRole("button", { name: "Vista de galeria" }));

    expect(await screen.findByText("Portal azul")).toBeDefined();
    expect(readStoredPreferences().galleryView).toBe("gallery");
  });

  it("initializes the interface from centralized preferences", async () => {
    const fetchMock = mockAppShellFetch();

    renderAppShell("es", {
      preferences: {
        galleryScope: "mine",
        galleryView: "map",
        theme: "light",
      },
    });

    const map = await screen.findByRole("region", { name: "Mapa de publicaciones" });
    expect(map.getAttribute("data-publication-ids")).toBe("1");
    expect(map.getAttribute("data-theme")).toBe("light");
    expect(screen.getByRole("button", { name: "Mis publicaciones" }).getAttribute("aria-pressed")).toBe("true");
    expect(fetchMock).not.toHaveBeenCalledWith("/api/auth/me");
  });

  it("resets a stored private scope for an anonymous session", async () => {
    mockAppShellFetch();

    renderAppShell("val", {
      preferences: { galleryScope: "mine" },
      user: null,
    });

    await screen.findByText("Portal azul");
    expect(screen.getByRole("button", { name: "Totes les publicacions" }).getAttribute("aria-pressed")).toBe("true");
    expect(readStoredPreferences().galleryScope).toBe("all");
  });

  it("opens the responsive navigation and exposes its actions", async () => {
    mockAppShellFetch();

    renderAppShell();

    expect(await screen.findByText("Portal azul")).toBeDefined();
    const navigation = screen.getByRole("navigation", { name: "Navegació principal" });
    const openMenuButton = within(navigation).getByRole("button", { name: "Obrir el menú" });

    expect(openMenuButton.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(openMenuButton);

    expect(within(navigation).getByRole("button", { name: "Tancar el menú" }).getAttribute("aria-expanded")).toBe("true");
    const themeButton = within(navigation).getByRole("button", { name: "Activar el mode clar" });
    expect(within(themeButton).getByText("Mode fosc")).toBeDefined();
    fireEvent.click(themeButton);
    expect(within(navigation).getByRole("button", { name: "Activar el mode fosc" })).toBeDefined();
    expect(within(themeButton).getByText("Mode clar")).toBeDefined();
    expect(within(navigation).getByRole("button", { name: "Canviar a castellà" }).textContent).toBe("val");
    expect(within(navigation).getByRole("button", { name: "El meu perfil: Ana" })).toBeDefined();
    expect(within(navigation).getByRole("button", { name: "Pujar imatge" })).toBeDefined();

    fireEvent.keyDown(window, { key: "Escape" });
    const reopenedMenuButton = within(navigation).getByRole("button", { name: "Obrir el menú" });
    expect(document.activeElement).toBe(reopenedMenuButton);

    fireEvent.click(reopenedMenuButton);
    fireEvent.click(within(navigation).getByRole("button", { name: "Pujar imatge" }));

    expect(await screen.findByText("Nova publicació")).toBeDefined();
    expect(await screen.findByRole("heading", { name: "Puja les imatges d'una casa i localitza-la" })).toBeDefined();
    expect(within(navigation).getByRole("button", { name: "Obrir el menú" }).getAttribute("aria-expanded")).toBe("false");
  });

  it("keeps map markers in sync with the search, scope, and detail modal", async () => {
    mockAppShellFetch();

    renderAppShell();

    expect(await screen.findByText("Portal azul")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Vista de mapa" }));

    const map = await screen.findByRole("region", { name: "Mapa de publicacions" });
    expect(map.getAttribute("data-publication-ids")).toBe("1,2");

    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar en la galeria" }), {
      target: { value: "cabanyal" },
    });
    await waitFor(() => {
      expect(map.getAttribute("data-publication-ids")).toBe("2");
    });

    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar en la galeria" }), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Les meues publicacions" }));
    await waitFor(() => {
      expect(map.getAttribute("data-publication-ids")).toBe("1");
    });

    fireEvent.click(screen.getByRole("button", { name: "Obrir el primer marcador" }));
    expect(await screen.findByText("Fitxa de la peça")).toBeDefined();
    expect(screen.getByRole("heading", { name: "Portal azul" })).toBeDefined();
  });

  it("shows every photo from the user's publication in the profile grid", async () => {
    mockAppShellFetch({ multiplePhotos: true });

    renderAppShell();

    fireEvent.click(await screen.findByRole("button", { name: "El meu perfil: Ana" }));

    expect(await screen.findAllByAltText(/Portal azul, foto/)).toHaveLength(3);
    expect(screen.getByText("3 imatges")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Canviar a castellà" }));
    expect(await screen.findByText("3 imágenes")).toBeDefined();
  });

  it("keeps the authenticated state when logout fails", async () => {
    mockAppShellFetch({ logoutSucceeds: false });
    renderAppShell("val", { preferences: { galleryScope: "mine" } });

    fireEvent.click(await screen.findByRole("button", { name: "El meu perfil: Ana" }));
    fireEvent.click(await screen.findByRole("button", { name: "Tancar la sessió" }));

    expect(await screen.findByText("No s'ha pogut tancar la sessió")).toBeDefined();
    expect(screen.getByRole("heading", { name: "Ana Soler" })).toBeDefined();
    expect(readStoredPreferences().galleryScope).toBe("mine");
  });

  it("keeps the authenticated state when account deletion fails", async () => {
    mockAppShellFetch({ accountDeleteStatus: 500 });
    renderAppShell("val", { preferences: { galleryScope: "mine" } });

    fireEvent.click(await screen.findByRole("button", { name: "El meu perfil: Ana" }));
    fireEvent.click(await screen.findByRole("button", { name: "Esborrar l'usuari" }));

    expect(await screen.findByText("No s'ha pogut esborrar l'usuari")).toBeDefined();
    expect(screen.getByRole("heading", { name: "Ana Soler" })).toBeDefined();
    expect(readStoredPreferences().galleryScope).toBe("mine");
  });

  it("clears stale authenticated state when account deletion returns unauthorized", async () => {
    mockAppShellFetch({ accountDeleteStatus: 401 });
    renderAppShell("val", { preferences: { galleryScope: "mine" } });

    fireEvent.click(await screen.findByRole("button", { name: "El meu perfil: Ana" }));
    fireEvent.click(await screen.findByRole("button", { name: "Esborrar l'usuari" }));

    expect(await screen.findByRole("button", { name: "Log in" })).toBeDefined();
    expect(screen.queryByRole("heading", { name: "Ana Soler" })).toBeNull();
    expect(readStoredPreferences().galleryScope).toBe("all");
  });

  it("translates the selected file count", async () => {
    mockAppShellFetch();

    renderAppShell();

    const navigation = await screen.findByRole("navigation", { name: "Navegació principal" });
    await screen.findByRole("button", { name: "El meu perfil: Ana" });
    fireEvent.click(within(navigation).getByRole("button", { name: "Pujar imatge" }));

    const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');
    expect(fileInput).not.toBeNull();
    const firstFile = new File(["one"], "one.jpg", { type: "image/jpeg" });
    const secondFile = new File(["two"], "two.jpg", { type: "image/jpeg" });

    fireEvent.change(fileInput!, { target: { files: [firstFile] } });
    expect(await screen.findByText("1 fitxer seleccionat")).toBeDefined();

    fireEvent.change(fileInput!, { target: { files: [firstFile, secondFile] } });
    expect(await screen.findByText("2 fitxers seleccionats")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Canviar a castellà" }));
    expect(await screen.findByText("2 archivos seleccionados")).toBeDefined();
  });

  it("confirms deleting a profile thumbnail without leaving the profile flow", async () => {
    mockAppShellFetch({ multiplePhotos: true });

    renderAppShell();

    fireEvent.click(await screen.findByRole("button", { name: "El meu perfil: Ana" }));
    fireEvent.click(await screen.findByRole("button", { name: "Esborrar Portal azul, foto 1" }));

    expect(
      await screen.findByText("Vols eliminar esta imatge? Si és així, s'eliminarà la imatge actual i es conservaran les altres imatges del mateix grup."),
    ).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Cancel·lar" }));
    expect(await screen.findByText("Arxiu personal")).toBeDefined();
  });

  it("shows the short confirmation for a single photo deleted from the profile", async () => {
    mockAppShellFetch();

    renderAppShell();

    fireEvent.click(await screen.findByRole("button", { name: "El meu perfil: Ana" }));
    fireEvent.click(await screen.findByRole("button", { name: "Esborrar Portal azul, foto 1" }));

    expect(await screen.findByText("Vols eliminar esta imatge?")).toBeDefined();
    expect(screen.queryByText(/altres imatges del mateix grup/)).toBeNull();
  });

  it("shows an empty search state when no images match", async () => {
    mockAppShellFetch();

    renderAppShell();

    await screen.findByText("Portal azul");

    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar en la galeria" }), {
      target: { value: "sin coincidencias" },
    });

    expect(await screen.findByText("No hi ha cap imatge que coincidisca amb la busca.")).toBeDefined();
  });

  it("opens publication details with owner actions after clicking an image", async () => {
    mockAppShellFetch();

    renderAppShell();

    fireEvent.click(await screen.findByRole("button", { name: "Veure els detalls de Portal azul" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Fitxa de la peça")).toBeDefined();
    expect(within(dialog).getByText("Carrer Major 12, Manises")).toBeDefined();
    expect(within(dialog).getByRole("button", { name: "Editar" })).toBeDefined();
    expect(within(dialog).getByRole("button", { name: "Esborrar" })).toBeDefined();
  });

  it("does not show owner actions for another user's publication", async () => {
    mockAppShellFetch();

    renderAppShell();

    fireEvent.click(await screen.findByRole("button", { name: "Veure els detalls de Rosa verde" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Avinguda del Port 4, Valencia")).toBeDefined();
    expect(within(dialog).queryByRole("button", { name: "Editar" })).toBeNull();
    expect(within(dialog).queryByRole("button", { name: "Esborrar" })).toBeNull();
  });

  it("renders every uploaded photo and navigates through the group", async () => {
    mockAppShellFetch({ multiplePhotos: true });

    renderAppShell();

    const imageButtons = await screen.findAllByRole("button", { name: "Veure els detalls de Portal azul" });
    expect(imageButtons).toHaveLength(3);

    fireEvent.click(imageButtons[1]);

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("2 de 3")).toBeDefined();

    fireEvent.click(within(dialog).getByRole("button", { name: "Foto anterior" }));
    expect(within(dialog).getByText("1 de 3")).toBeDefined();

    fireEvent.click(within(dialog).getByRole("button", { name: "Foto següent" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Foto següent" }));
    expect(within(dialog).getByText("3 de 3")).toBeDefined();
    expect((within(dialog).getByRole("button", { name: "Foto següent" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows the group deletion confirmation for the last photo", async () => {
    mockAppShellFetch();

    renderAppShell();

    fireEvent.click(await screen.findByRole("button", { name: "Veure els detalls de Portal azul" }));
    fireEvent.click(await screen.findByRole("button", { name: "Esborrar" }));

    expect(
      await screen.findByText("Vols eliminar esta imatge?"),
    ).toBeDefined();
  });

  it("confirms deleting only the current photo when a group has more images", async () => {
    mockAppShellFetch({ multiplePhotos: true });

    renderAppShell();

    fireEvent.click((await screen.findAllByRole("button", { name: "Veure els detalls de Portal azul" }))[0]);
    fireEvent.click(await screen.findByRole("button", { name: "Esborrar" }));

    expect(
      await screen.findByText("Vols eliminar esta imatge? Si és així, s'eliminarà la imatge actual i es conservaran les altres imatges del mateix grup."),
    ).toBeDefined();
  });

  it("opens the login modal when an anonymous visitor clicks an image", async () => {
    mockAppShellFetch();

    renderAppShell("val", { user: null });

    expect(await screen.findByRole("button", { name: "Log in" })).toBeDefined();
    fireEvent.click(await screen.findByRole("button", { name: "Veure els detalls de Portal azul" }));

    expect(await screen.findByRole("heading", { name: "Entra a l'arxiu." })).toBeDefined();
  });

  it("opens the login modal when an anonymous visitor selects own publications", async () => {
    mockAppShellFetch();

    renderAppShell("val", { user: null });

    fireEvent.click(await screen.findByRole("button", { name: "Les meues publicacions, inicia sessió" }));

    expect(await screen.findByRole("heading", { name: "Entra a l'arxiu." })).toBeDefined();
  });

  it("changes the interface language and persists the selection", async () => {
    mockAppShellFetch();

    renderAppShell("val", { user: null });

    expect(await screen.findByRole("heading", { name: "Taulells, mosaics, rajoles, xapats" })).toBeDefined();
    const languageButton = screen.getByRole("button", { name: "Canviar a castellà" });
    expect(languageButton.textContent).toBe("val");

    fireEvent.click(languageButton);

    expect(await screen.findByRole("heading", { name: "Azulejos, mosaicos, baldosas, chapados" })).toBeDefined();
    expect(screen.getByRole("navigation", { name: "Navegación principal" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Cambiar a valenciano" }).textContent).toBe("es");
    expect(screen.getByRole("button", { name: "Activar el modo claro" }).getAttribute("title")).toBe("Activar el modo claro");
    expect(document.documentElement.lang).toBe("es-ES");
    expect(readStoredPreferences().locale).toBe("es");
    expect(document.cookie).not.toContain("taulellari_locale=");
    expect(refreshMock).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Vista de mapa" }));
    expect(await screen.findByRole("region", { name: "Mapa de publicaciones" })).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Cambiar a valenciano" }));
    expect(await screen.findByRole("heading", { name: "Taulells, mosaics, rajoles, xapats" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Canviar a castellà" }).textContent).toBe("val");
    expect(document.documentElement.lang).toBe("ca-ES-valencia");
    expect(refreshMock).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByRole("button", { name: "Log in" }));
    expect(await screen.findByPlaceholderText("Correu electrònic")).toBeDefined();
  });

  it("renders Spanish from the initial locale", async () => {
    mockAppShellFetch();

    document.documentElement.lang = "xx";
    renderAppShell("es", { user: null });

    expect(await screen.findByRole("heading", { name: "Azulejos, mosaicos, baldosas, chapados" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Cambiar a valenciano" }).textContent).toBe("es");
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));
    expect(await screen.findByPlaceholderText("Correo electrónico")).toBeDefined();
    expect(document.documentElement.lang).toBe("es-ES");
  });
});

function mockAppShellFetch({
  accountDeleteStatus = 200,
  logoutSucceeds = true,
  multiplePhotos = false,
} = {}) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);

    if (url === "/api/auth/logout") {
      return Response.json(
        logoutSucceeds ? { ok: true } : { error: "Logout failed" },
        { status: logoutSucceeds ? 200 : 500 },
      );
    }

    if (url === "/api/users/me" && init?.method === "DELETE") {
      return Response.json(
        accountDeleteStatus === 200 ? { ok: true } : { error: "Delete failed" },
        { status: accountDeleteStatus },
      );
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

function readStoredPreferences() {
  const prefix = `${APP_PREFERENCES_COOKIE_NAME}=`;
  const value = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(prefix))
    ?.slice(prefix.length);

  return parseAppPreferences(value);
}

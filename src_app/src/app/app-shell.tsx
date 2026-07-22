"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Upload } from "lucide-react";
import { FormEvent, useDeferredValue, useEffect, useId, useRef, useState } from "react";

import styles from "./page.module.css";

type AuthUser = {
  id: number;
  email: string;
  nombre: string;
  apellidos: string;
};

type AddressSuggestion = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
};

type Publication = {
  id: number;
  titulo?: string;
  descripcion?: string;
  direccionTexto?: string;
  latitud?: number;
  longitud?: number;
  creadoEn?: string;
  isOwner?: boolean;
  metadatos?: unknown;
  fotos: { id: number; index: number; url: string }[];
};

type Modal = "login" | "register" | "upload" | "profile" | "detail" | "photo-confirm" | "edit" | null;

export function AppShell() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [modal, setModal] = useState<Modal>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [selectedPublication, setSelectedPublication] = useState<Publication | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [galleryQuery, setGalleryQuery] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const deferredGalleryQuery = useDeferredValue(galleryQuery);
  const filteredPublications = filterPublications(publications, deferredGalleryQuery);

  useEffect(() => {
    refreshSession();
    refreshGallery();
  }, []);

  async function refreshSession() {
    const response = await fetch("/api/auth/me");

    if (!response.ok) {
      setUser(null);
      return;
    }

    const data: { user: AuthUser | null } = await response.json();
    setUser(data.user);
  }

  async function refreshGallery(): Promise<Publication[]> {
    const response = await fetch("/api/publicaciones");

    if (!response.ok) {
      setPublications([]);
      return [];
    }

    const data: { publicaciones: Publication[] } = await response.json();
    setPublications(data.publicaciones);
    return data.publicaciones;
  }

  function closeModal() {
    setModal(null);
    setSelectedPublication(null);
    setSelectedPhotoIndex(null);
    setMessage("");
  }

  function openPublication(publication: Publication, photoIndex: number) {
    setSelectedPublication(publication);
    setSelectedPhotoIndex(photoIndex);
    setMessage("");
    setModal(user ? "detail" : "login");
  }

  async function completeAuthentication(nextUser: AuthUser) {
    setUser(nextUser);
    const refreshedPublications = await refreshGallery();
    const pendingPublicationId = selectedPublication?.id;

    if (pendingPublicationId) {
      const publication = refreshedPublications.find(({ id }) => id === pendingPublicationId);
      setSelectedPublication(publication ?? null);
      setModal(publication ? "detail" : null);
      return;
    }

    setModal(null);
  }

  async function deletePhoto(publication: Publication, photoIndex: number) {
    setIsSubmitting(true);
    setMessage("");

    const response = await fetch(`/api/publicaciones/${publication.id}/fotos/${photoIndex}`, {
      method: "DELETE",
    });
    const data: { error?: string } = await response.json();
    setIsSubmitting(false);

    if (!response.ok) {
      setMessage(data.error ?? "No se pudo borrar la imagen");
      setModal("detail");
      return;
    }

    const currentPhotoPosition = publication.fotos.findIndex((photo) => photo.index === photoIndex);
    const refreshedPublications = await refreshGallery();
    const refreshedPublication = refreshedPublications.find(({ id }) => id === publication.id);

    if (!refreshedPublication || refreshedPublication.fotos.length === 0) {
      closeModal();
      return;
    }

    const nextPhotoPosition = Math.max(
      0,
      Math.min(currentPhotoPosition, refreshedPublication.fotos.length - 1),
    );
    setSelectedPublication(refreshedPublication);
    setSelectedPhotoIndex(refreshedPublication.fotos[nextPhotoPosition].index);
    setModal("detail");
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    closeModal();
    await refreshGallery();
  }

  return (
    <div className={`${styles.app} ${styles[theme]}`}>
      <nav className={styles.navbar}>
        <a className={styles.brand} href="#hero" aria-label="Ir al inicio">
          Taulellari
        </a>
        <div className={styles.navActions}>
          <button
            className={styles.iconButton}
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            type="button"
          >
            {theme === "light" ? "Negro" : "Blanco"}
          </button>
          {user ? (
            <button className={styles.navButton} onClick={() => setModal("profile")} type="button">
              {user.nombre}
            </button>
          ) : (
            <button className={styles.navButton} onClick={() => setModal("login")} type="button">
              Entrar
            </button>
          )}
          <button className={styles.plusButton} onClick={() => setModal(user ? "upload" : "login")} type="button">
            +
          </button>
        </div>
      </nav>

      <header className={styles.heroScreen} id="hero">
        <div className={styles.heroContent}>
          <span className={styles.kicker}>Ceramica viva de Valencia</span>
          <h1>Busca, fotografia y conserva azulejos de calle.</h1>
          <div className={styles.heroActions}>
            <a className={styles.heroPrimaryAction} href="#galeria">
              Ver galeria
            </a>
            <button className={styles.heroUploadAction} onClick={() => setModal(user ? "upload" : "login")} type="button">
              <span>+</span>
              Subir imagen
            </button>
          </div>
        </div>
      </header>

      <main className={styles.gallerySurface} id="galeria">
        <section className={styles.galleryIntro}>
          <span className={styles.kicker}>Galeria publica</span>
          <h2>Fotos abiertas. Datos sensibles bajo sesion.</h2>
          <p>
            Cualquier visitante puede ver las imagenes. Las descripciones,
            coordenadas y acciones de edicion aparecen solo al iniciar sesion.
          </p>
        </section>
        <GallerySearch
          onChange={setGalleryQuery}
          query={galleryQuery}
        />
        <PublicationGallery
          hasSearch={deferredGalleryQuery.trim().length > 0}
          onOpen={openPublication}
          publications={filteredPublications}
        />
      </main>

      {modal ? (
        <ModalShell
          className={modal === "detail" ? styles.detailModal : undefined}
          onClose={modal === "photo-confirm" ? () => setModal("detail") : closeModal}
        >
          {modal === "login" ? (
            <LoginModal
              isSubmitting={isSubmitting}
              onRegister={() => setModal("register")}
              onSubmit={async (email, password) => {
                setIsSubmitting(true);
                setMessage("");
                const response = await fetch("/api/auth/login", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email, password }),
                });
                const data: { user?: AuthUser; error?: string } = await response.json();
                setIsSubmitting(false);

                if (!response.ok || !data.user) {
                  setMessage(data.error ?? "No se pudo iniciar sesion");
                  return;
                }

                await completeAuthentication(data.user);
              }}
            />
          ) : null}
          {modal === "register" ? (
            <RegisterModal
              isSubmitting={isSubmitting}
              onLogin={() => setModal("login")}
              onSubmit={async (payload) => {
                setIsSubmitting(true);
                setMessage("");
                const response = await fetch("/api/auth/register", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                });
                const data: { user?: AuthUser; error?: string } = await response.json();
                setIsSubmitting(false);

                if (!response.ok || !data.user) {
                  setMessage(data.error ?? "No se pudo registrar");
                  return;
                }

                await completeAuthentication(data.user);
              }}
            />
          ) : null}
          {modal === "upload" && user ? (
            <UploadModal
              isSubmitting={isSubmitting}
              onSubmit={async (formData) => {
                setIsSubmitting(true);
                setMessage("");
                const response = await fetch("/api/publicaciones", {
                  method: "POST",
                  body: formData,
                });
                const data: { error?: string } = await response.json();
                setIsSubmitting(false);

                if (!response.ok) {
                  setMessage(data.error ?? "No se pudo guardar");
                  return;
                }

                setModal(null);
                await refreshGallery();
              }}
            />
          ) : null}
          {modal === "detail" && selectedPublication ? (
            <PublicationDetailModal
              key={`${selectedPublication.id}-${selectedPhotoIndex ?? 1}`}
              initialPhotoIndex={selectedPhotoIndex ?? selectedPublication.fotos[0]?.index ?? 1}
              isSubmitting={isSubmitting}
              onDeleteRequest={(photoIndex) => {
                setSelectedPhotoIndex(photoIndex);
                setModal("photo-confirm");
              }}
              onEdit={() => setModal("edit")}
              publication={selectedPublication}
            />
          ) : null}
          {modal === "photo-confirm" && selectedPublication && selectedPhotoIndex !== null ? (
            <DeletePhotoConfirmation
              isLastPhoto={selectedPublication.fotos.length === 1}
              isSubmitting={isSubmitting}
              onCancel={() => setModal("detail")}
              onConfirm={() => deletePhoto(selectedPublication, selectedPhotoIndex)}
            />
          ) : null}
          {modal === "edit" && selectedPublication ? (
            <EditPublicationModal
              isSubmitting={isSubmitting}
              onSubmit={async (payload) => {
                setIsSubmitting(true);
                setMessage("");
                const response = await fetch(`/api/publicaciones/${selectedPublication.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                });
                const data: { error?: string } = await response.json();
                setIsSubmitting(false);

                if (!response.ok) {
                  setMessage(data.error ?? "No se pudo editar");
                  return;
                }

                closeModal();
                await refreshGallery();
              }}
              publication={selectedPublication}
            />
          ) : null}
          {modal === "profile" && user ? (
            <ProfileModal
              isSubmitting={isSubmitting}
              message={message}
              onDeleteAccount={async () => {
                await fetch("/api/users/me", { method: "DELETE" });
                setUser(null);
                closeModal();
                await refreshGallery();
              }}
              onLogout={logout}
              onSubmit={async (payload) => {
                setIsSubmitting(true);
                const response = await fetch("/api/users/me", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                });
                const data: { user?: AuthUser; error?: string } = await response.json();
                setIsSubmitting(false);

                if (!response.ok || !data.user) {
                  setMessage(data.error ?? "No se pudo actualizar el perfil");
                  return;
                }

                setUser(data.user);
                setMessage("Perfil actualizado");
              }}
              publications={publications.filter((publication) => publication.isOwner)}
              user={user}
            />
          ) : null}
          {message ? <p className={styles.modalStatus}>{message}</p> : null}
        </ModalShell>
      ) : null}
    </div>
  );
}

function GallerySearch({
  onChange,
  query,
}: {
  onChange: (query: string) => void;
  query: string;
}) {
  return (
    <section className={styles.gallerySearch} aria-label="Buscar en la galeria">
      <label htmlFor="gallery-search">Buscar en la galeria</label>
      <input
        id="gallery-search"
        onChange={(event) => onChange(event.target.value)}
        placeholder="Busca por titulo, descripcion o metadatos"
        type="search"
        value={query}
      />
    </section>
  );
}

function filterPublications(publications: Publication[], query: string) {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return publications;
  }

  return publications.filter((publication) => getPublicationSearchText(publication).includes(normalizedQuery));
}

function getPublicationSearchText(publication: Publication) {
  return normalizeSearchText(
    [
      publication.titulo,
      publication.descripcion,
      publication.direccionTexto,
      publication.latitud,
      publication.longitud,
      publication.creadoEn,
      stringifyMetadata(publication.metadatos),
    ]
      .filter((value) => value !== undefined && value !== null)
      .join(" "),
  );
}

function stringifyMetadata(metadata: unknown) {
  if (!metadata) {
    return "";
  }

  if (typeof metadata === "string" || typeof metadata === "number" || typeof metadata === "boolean") {
    return String(metadata);
  }

  try {
    return JSON.stringify(metadata);
  } catch {
    return "";
  }
}

function normalizeSearchText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function ModalShell({
  children,
  className,
  onClose,
}: {
  children: React.ReactNode;
  className?: string;
  onClose: () => void;
}) {
  return (
    <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
      <div className={`${styles.modalCard} ${className ?? ""}`}>
        <button className={styles.closeButton} onClick={onClose} type="button">
          Cerrar
        </button>
        {children}
      </div>
    </div>
  );
}

function LoginModal({
  isSubmitting,
  onRegister,
  onSubmit,
}: {
  isSubmitting: boolean;
  onRegister: () => void;
  onSubmit: (email: string, password: string) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <form className={styles.modalForm} onSubmit={(event) => submitCredentials(event, () => onSubmit(email, password))}>
      <span className={styles.kicker}>Login</span>
      <h2>Entra al archivo.</h2>
      <input onChange={(event) => setEmail(event.target.value)} placeholder="Email" required type="email" value={email} />
      <input minLength={8} onChange={(event) => setPassword(event.target.value)} placeholder="Contraseña" required type="password" value={password} />
      <button disabled={isSubmitting} type="submit">Entrar</button>
      <button className={styles.textButton} onClick={onRegister} type="button">Crear cuenta</button>
    </form>
  );
}

function RegisterModal({
  isSubmitting,
  onLogin,
  onSubmit,
}: {
  isSubmitting: boolean;
  onLogin: () => void;
  onSubmit: (payload: { email: string; nombre: string; apellidos: string; password: string }) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [password, setPassword] = useState("");

  return (
    <form className={styles.modalForm} onSubmit={(event) => submitCredentials(event, () => onSubmit({ email, nombre, apellidos, password }))}>
      <span className={styles.kicker}>Registro</span>
      <h2>Crea tu perfil.</h2>
      <input onChange={(event) => setNombre(event.target.value)} placeholder="Nombre" required value={nombre} />
      <input onChange={(event) => setApellidos(event.target.value)} placeholder="Apellidos" required value={apellidos} />
      <input onChange={(event) => setEmail(event.target.value)} placeholder="Email" required type="email" value={email} />
      <input minLength={8} onChange={(event) => setPassword(event.target.value)} placeholder="Contraseña" required type="password" value={password} />
      <button disabled={isSubmitting} type="submit">Registrarme</button>
      <button className={styles.textButton} onClick={onLogin} type="button">Ya tengo cuenta</button>
    </form>
  );
}

function UploadModal({
  isSubmitting,
  onSubmit,
}: {
  isSubmitting: boolean;
  onSubmit: (formData: FormData) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [selectedAddress, setSelectedAddress] = useState<AddressSuggestion | null>(null);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputId = useId();
  const {
    containerRef: addressSearchRef,
    maxHeight: suggestionsMaxHeight,
  } = useSuggestionsMaxHeight(address.length > 0 && suggestions.length > 0);
  const deferredAddress = useDeferredValue(address);

  useEffect(() => {
    if (selectedAddress || deferredAddress.trim().length < 1) {
      return;
    }

    const controller = new AbortController();

    fetch(`/api/addresses?q=${encodeURIComponent(deferredAddress)}`, {
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : { suggestions: [] }))
      .then((data: { suggestions: AddressSuggestion[] }) => {
        if (!controller.signal.aborted) {
          setSuggestions(data.suggestions);
        }
      })
      .catch((error) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setSuggestions([]);
        }
      });

    return () => controller.abort();
  }, [deferredAddress, selectedAddress]);

  return (
    <form className={styles.modalForm} onSubmit={(event) => {
      event.preventDefault();
      if (!selectedAddress) return;
      const formData = new FormData();
      formData.set("titulo", title);
      formData.set("descripcion", description);
      formData.set("direccionTexto", selectedAddress.label);
      formData.set("latitud", String(selectedAddress.latitude));
      formData.set("longitud", String(selectedAddress.longitude));
      files.forEach((file) => formData.append("fotos", file));
      onSubmit(formData);
    }}>
      <span className={styles.kicker}>Nueva pieza</span>
      <h2>Sube una fachada.</h2>
      <input maxLength={120} onChange={(event) => setTitle(event.target.value)} placeholder="Titulo" required value={title} />
      <textarea maxLength={120} onChange={(event) => setDescription(event.target.value)} placeholder="Descripcion (opcional)" rows={1} value={description} />
      <div className={styles.heroSearch} ref={addressSearchRef}>
        <input onChange={(event) => { setAddress(event.target.value); setSelectedAddress(null); setSuggestions([]); }} placeholder="Direccion exacta" required value={address} />
        {address && suggestions.length > 0 ? (
          <div className={styles.floatingSuggestions} style={{ maxHeight: suggestionsMaxHeight }}>
            {suggestions.map((suggestion) => (
              <button key={suggestion.id} onClick={() => { setSelectedAddress(suggestion); setAddress(suggestion.label); setSuggestions([]); }} type="button">
                {suggestion.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <label className={styles.fileUpload} htmlFor={fileInputId}>
        <span>Subir fotos</span>
        <span className={styles.fileUploadIcon} aria-hidden="true">
          <Upload size={24} strokeWidth={2} />
        </span>
        {files.length > 0 ? <small>{`${files.length} archivo${files.length === 1 ? "" : "s"} seleccionado${files.length === 1 ? "" : "s"}`}</small> : null}
        <input id={fileInputId} accept="image/*" capture="environment" className={styles.hiddenFileInput} multiple onChange={(event) => setFiles(Array.from(event.target.files ?? []))} type="file" />
      </label>
      <button disabled={isSubmitting || !selectedAddress || files.length < 1} type="submit">Guardar</button>
    </form>
  );
}

function EditPublicationModal({
  isSubmitting,
  onSubmit,
  publication,
}: {
  isSubmitting: boolean;
  onSubmit: (payload: {
    titulo: string;
    descripcion: string | null;
    direccionTexto: string;
    latitud: number;
    longitud: number;
  }) => Promise<void>;
  publication: Publication;
}) {
  const [title, setTitle] = useState(publication.titulo ?? "");
  const [description, setDescription] = useState(publication.descripcion ?? "");
  const [address, setAddress] = useState(publication.direccionTexto ?? "");
  const [selectedAddress, setSelectedAddress] = useState<AddressSuggestion | null>(
    typeof publication.latitud === "number" && typeof publication.longitud === "number"
      ? {
          id: String(publication.id),
          label: publication.direccionTexto ?? "",
          latitude: publication.latitud,
          longitude: publication.longitud,
        }
      : null,
  );
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const {
    containerRef: addressSearchRef,
    maxHeight: suggestionsMaxHeight,
  } = useSuggestionsMaxHeight(address.length > 0 && suggestions.length > 0);
  const deferredAddress = useDeferredValue(address);

  useEffect(() => {
    if (selectedAddress || deferredAddress.trim().length < 1) {
      return;
    }

    const controller = new AbortController();

    fetch(`/api/addresses?q=${encodeURIComponent(deferredAddress)}`, {
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : { suggestions: [] }))
      .then((data: { suggestions: AddressSuggestion[] }) => {
        if (!controller.signal.aborted) {
          setSuggestions(data.suggestions);
        }
      })
      .catch((error) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setSuggestions([]);
        }
      });

    return () => controller.abort();
  }, [deferredAddress, selectedAddress]);

  return (
    <form
      className={styles.modalForm}
      onSubmit={(event) => {
        event.preventDefault();
        if (!selectedAddress) return;
        onSubmit({
          titulo: title,
          descripcion: description || null,
          direccionTexto: selectedAddress.label,
          latitud: selectedAddress.latitude,
          longitud: selectedAddress.longitude,
        });
      }}
    >
      <span className={styles.kicker}>Editar pieza</span>
      <h2>Actualiza los datos.</h2>
      <input maxLength={120} onChange={(event) => setTitle(event.target.value)} placeholder="Titulo" required value={title} />
      <textarea maxLength={120} onChange={(event) => setDescription(event.target.value)} placeholder="Descripcion (opcional)" rows={1} value={description} />
      <div className={styles.heroSearch} ref={addressSearchRef}>
        <input
          onChange={(event) => {
            setAddress(event.target.value);
            setSelectedAddress(null);
            setSuggestions([]);
          }}
          placeholder="Direccion exacta"
          required
          value={address}
        />
        {address && suggestions.length > 0 ? (
          <div className={styles.floatingSuggestions} style={{ maxHeight: suggestionsMaxHeight }}>
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={() => {
                  setSelectedAddress(suggestion);
                  setAddress(suggestion.label);
                  setSuggestions([]);
                }}
                type="button"
              >
                {suggestion.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <button disabled={isSubmitting || !selectedAddress} type="submit">Guardar cambios</button>
    </form>
  );
}

function ProfileModal({
  isSubmitting,
  message,
  onDeleteAccount,
  onLogout,
  onSubmit,
  publications,
  user,
}: {
  isSubmitting: boolean;
  message: string;
  onDeleteAccount: () => Promise<void>;
  onLogout: () => Promise<void>;
  onSubmit: (payload: { email: string; nombre: string; apellidos: string; password?: string }) => Promise<void>;
  publications: Publication[];
  user: AuthUser;
}) {
  const [email, setEmail] = useState(user.email);
  const [nombre, setNombre] = useState(user.nombre);
  const [apellidos, setApellidos] = useState(user.apellidos);
  const [password, setPassword] = useState("");

  return (
    <div className={styles.profileLayout}>
      <form className={styles.modalForm} onSubmit={(event) => submitCredentials(event, () => onSubmit({ email, nombre, apellidos, password: password || undefined }))}>
        <span className={styles.kicker}>Perfil</span>
        <h2>{user.nombre} {user.apellidos}</h2>
        <input onChange={(event) => setNombre(event.target.value)} value={nombre} />
        <input onChange={(event) => setApellidos(event.target.value)} value={apellidos} />
        <input onChange={(event) => setEmail(event.target.value)} type="email" value={email} />
        <input minLength={8} onChange={(event) => setPassword(event.target.value)} placeholder="Nueva contraseña opcional" type="password" value={password} />
        <button disabled={isSubmitting} type="submit">Guardar perfil</button>
        <button className={styles.textButton} onClick={onLogout} type="button">Cerrar sesion</button>
        <button className={styles.dangerButton} onClick={onDeleteAccount} type="button">Borrar usuario</button>
        {message ? <p className={styles.modalStatus}>{message}</p> : null}
      </form>
      <div className={styles.profileGrid}>
        {publications.map((publication) => (
          <div className={styles.profileThumb} key={publication.id}>
            {publication.fotos[0] ? <Image alt={publication.titulo ?? "Foto"} fill src={publication.fotos[0].url} unoptimized /> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function PublicationDetailModal({
  initialPhotoIndex,
  isSubmitting,
  onDeleteRequest,
  onEdit,
  publication,
}: {
  initialPhotoIndex: number;
  isSubmitting: boolean;
  onDeleteRequest: (photoIndex: number) => void;
  onEdit: () => void;
  publication: Publication;
}) {
  const [activePhotoIndex, setActivePhotoIndex] = useState(initialPhotoIndex);
  const activePhotoPosition = Math.max(
    0,
    publication.fotos.findIndex((photo) => photo.index === activePhotoIndex),
  );
  const activePhoto = publication.fotos[activePhotoPosition];

  function movePhoto(direction: -1 | 1) {
    const nextPosition = activePhotoPosition + direction;

    if (nextPosition < 0 || nextPosition >= publication.fotos.length) {
      return;
    }

    setActivePhotoIndex(publication.fotos[nextPosition].index);
  }

  return (
    <div className={styles.publicationDetail}>
      <div className={styles.publicationDetailVisual}>
        <div className={styles.publicationDetailImage}>
          {activePhoto ? (
            <Image
              alt={publication.titulo ?? "Imagen de la publicacion"}
              fill
              sizes="(max-width: 860px) 90vw, 60vw"
              src={activePhoto.url}
              unoptimized
            />
          ) : null}
          {publication.fotos.length > 1 ? (
            <>
              <button
                aria-label="Foto anterior"
                className={`${styles.publicationPhotoArrow} ${styles.previousPhotoArrow}`}
                disabled={activePhotoPosition === 0}
                onClick={() => movePhoto(-1)}
                type="button"
              >
                <ChevronLeft aria-hidden="true" size={28} strokeWidth={2.5} />
              </button>
              <button
                aria-label="Foto siguiente"
                className={`${styles.publicationPhotoArrow} ${styles.nextPhotoArrow}`}
                disabled={activePhotoPosition === publication.fotos.length - 1}
                onClick={() => movePhoto(1)}
                type="button"
              >
                <ChevronRight aria-hidden="true" size={28} strokeWidth={2.5} />
              </button>
              <span className={styles.publicationPhotoCounter}>
                {activePhotoPosition + 1} de {publication.fotos.length}
              </span>
            </>
          ) : null}
        </div>
        {publication.fotos.length > 1 ? (
          <div className={styles.publicationPhotoThumbs} aria-label="Fotos de la publicacion">
            {publication.fotos.map((photo, index) => (
              <button
                aria-label={`Ver foto ${index + 1}`}
                className={`${styles.publicationPhotoThumb} ${photo.index === activePhoto?.index ? styles.activePhotoThumb : ""}`}
                key={photo.id}
                onClick={() => setActivePhotoIndex(photo.index)}
                type="button"
              >
                <Image alt="" fill sizes="80px" src={photo.url} unoptimized />
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div className={styles.publicationDetailInfo}>
        <span className={styles.kicker}>Ficha de la pieza</span>
        <h2>{publication.titulo ?? "Pieza sin titulo"}</h2>
        {publication.descripcion ? <p className={styles.publicationDetailDescription}>{publication.descripcion}</p> : null}
        <dl className={styles.publicationDetailMeta}>
          <div>
            <dt>Direccion</dt>
            <dd>{publication.direccionTexto ?? "No disponible"}</dd>
          </div>
          {typeof publication.latitud === "number" && typeof publication.longitud === "number" ? (
            <div>
              <dt>Coordenadas</dt>
              <dd>{publication.latitud.toFixed(5)}, {publication.longitud.toFixed(5)}</dd>
            </div>
          ) : null}
          {publication.creadoEn ? (
            <div>
              <dt>Archivada</dt>
              <dd>{formatPublicationDate(publication.creadoEn)}</dd>
            </div>
          ) : null}
        </dl>
        {publication.isOwner && activePhoto ? (
          <div className={styles.publicationDetailActions}>
            <button disabled={isSubmitting} onClick={onEdit} type="button">Editar</button>
            <button className={styles.dangerButton} disabled={isSubmitting} onClick={() => onDeleteRequest(activePhoto.index)} type="button">Borrar</button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function DeletePhotoConfirmation({
  isLastPhoto,
  isSubmitting,
  onCancel,
  onConfirm,
}: {
  isLastPhoto: boolean;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}) {
  return (
    <div className={styles.confirmationModal}>
      <span className={styles.kicker}>Eliminar imagen</span>
      <h2>
        {isLastPhoto
          ? "¿Desea eliminar esta imagen? Es la última del grupo, por lo que también se eliminará la publicación."
          : "¿Desea eliminar esta imagen? Si es así se eliminará la imagen actual y se mantendrán el resto de imágenes del mismo grupo."}
      </h2>
      <div className={styles.confirmationActions}>
        <button disabled={isSubmitting} onClick={onCancel} type="button">Cancelar</button>
        <button className={styles.dangerButton} disabled={isSubmitting} onClick={onConfirm} type="button">Eliminar</button>
      </div>
    </div>
  );
}

function PublicationGallery({
  hasSearch,
  onOpen,
  publications,
}: {
  hasSearch: boolean;
  onOpen: (publication: Publication, photoIndex: number) => void;
  publications: Publication[];
}) {
  const galleryPhotos = publications.flatMap((publication) =>
    publication.fotos.map((photo) => ({ photo, publication })),
  );

  if (galleryPhotos.length === 0) {
    return <p className={styles.emptyState}>{hasSearch ? "No hay imagenes que coincidan con la busqueda." : "Todavia no hay fotos publicadas."}</p>;
  }

  return (
    <div className={styles.publicGallery}>
      {galleryPhotos.map(({ photo, publication }) => (
        <article className={styles.publicCard} key={`${publication.id}-${photo.id}`}>
          <button
            aria-label={`Ver detalles de ${publication.titulo ?? "la imagen"}`}
            className={`${styles.publicImageButton} ${publication.titulo ? styles.hasImageOverlay : ""}`}
            onClick={() => onOpen(publication, photo.index)}
            type="button"
          >
            <div className={styles.publicImage}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt={publication.titulo ?? "Azulejo"} decoding="async" loading="lazy" src={photo.url} />
            </div>
            {publication.titulo ? <span className={styles.publicImageOverlay}>{publication.titulo}</span> : null}
          </button>
        </article>
      ))}
    </div>
  );
}

function submitCredentials(event: FormEvent<HTMLFormElement>, callback: () => Promise<void>) {
  event.preventDefault();
  callback();
}

function formatPublicationDate(value: string) {
  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function useSuggestionsMaxHeight(active: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState<number>();

  useEffect(() => {
    if (!active) {
      return;
    }

    function updateMaxHeight() {
      setMaxHeight(getSuggestionsMaxHeight(containerRef.current));
    }

    updateMaxHeight();
    window.addEventListener("resize", updateMaxHeight);

    return () => window.removeEventListener("resize", updateMaxHeight);
  }, [active]);

  return { containerRef, maxHeight };
}

function getSuggestionsMaxHeight(container: HTMLDivElement | null) {
  if (!container || typeof window === "undefined") {
    return undefined;
  }

  const viewportPadding = 24;
  const dropdownGap = 8;
  const availableHeight = window.innerHeight - container.getBoundingClientRect().bottom - viewportPadding - dropdownGap;

  return Math.max(120, availableHeight);
}

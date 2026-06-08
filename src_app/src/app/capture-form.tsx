"use client";

import { FormEvent, useDeferredValue, useEffect, useState } from "react";

import styles from "./page.module.css";

type AuthUser = {
  id: number;
  email: string;
};

type AddressSuggestion = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
};

type AuthStatus = "checking" | "anonymous" | "authenticated";

export function CaptureForm() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>("checking");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [addressInput, setAddressInput] = useState("");
  const [selectedAddress, setSelectedAddress] = useState<AddressSuggestion | null>(null);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const deferredAddressInput = useDeferredValue(addressInput);
  const canSearchAddresses =
    authStatus === "authenticated" && deferredAddressInput.trim().length >= 3;

  useEffect(() => {
    let active = true;

    async function loadCurrentUser() {
      try {
        const response = await fetch("/api/auth/me");

        if (!active) {
          return;
        }

        if (!response.ok) {
          setAuthStatus("anonymous");
          return;
        }

        const data: { user: AuthUser | null } = await response.json();
        setUser(data.user);
        setAuthStatus(data.user ? "authenticated" : "anonymous");
      } catch {
        if (active) {
          setAuthStatus("anonymous");
        }
      }
    }

    loadCurrentUser();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!canSearchAddresses) {
      return;
    }

    const controller = new AbortController();

    async function searchAddresses() {
      try {
        const response = await fetch(
          `/api/addresses?q=${encodeURIComponent(deferredAddressInput)}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          setSuggestions([]);
          return;
        }

        const data: { suggestions: AddressSuggestion[] } = await response.json();
        setSuggestions(data.suggestions);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setSuggestions([]);
        }
      }
    }

    searchAddresses();

    return () => controller.abort();
  }, [canSearchAddresses, deferredAddressInput]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data: { user?: AuthUser; error?: string } = await response.json();

      if (!response.ok || !data.user) {
        setMessage(data.error ?? "No se pudo iniciar sesion");
        return;
      }

      setUser(data.user);
      setAuthStatus("authenticated");
      setMessage("Sesion iniciada. Ya puedes catalogar una pieza.");
    } catch {
      setMessage("No se pudo iniciar sesion");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCapture(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedAddress) {
      setMessage("Selecciona una direccion exacta del listado");
      return;
    }

    if (files.length < 1) {
      setMessage("Sube al menos una foto");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    const formData = new FormData();
    formData.set("titulo", title);
    formData.set("direccionTexto", selectedAddress.label);
    formData.set("latitud", String(selectedAddress.latitude));
    formData.set("longitud", String(selectedAddress.longitude));

    for (const file of files) {
      formData.append("fotos", file);
    }

    try {
      const response = await fetch("/api/publicaciones", {
        method: "POST",
        body: formData,
      });
      const data: { error?: string } = await response.json();

      if (!response.ok) {
        setMessage(data.error ?? "No se pudo guardar la publicacion");
        return;
      }

      setTitle("");
      setAddressInput("");
      setSelectedAddress(null);
      setSuggestions([]);
      setFiles([]);
      setMessage("Publicacion guardada en el archivo local.");
    } catch {
      setMessage("No se pudo guardar la publicacion");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleFilesChange(fileList: FileList | null) {
    setFiles(Array.from(fileList ?? []).slice(0, 3));
  }

  function selectAddress(suggestion: AddressSuggestion) {
    setSelectedAddress(suggestion);
    setAddressInput(suggestion.label);
    setSuggestions([]);
  }

  return (
    <section className={styles.panel} aria-label="Captura de azulejos">
      <div className={styles.cardHeader}>
        <span className={styles.kicker}>Archivo privado</span>
        <h2>Captura una fachada antes de que desaparezca.</h2>
        <p>
          Sube hasta tres fotos, fija la direccion exacta con Mapbox y guarda la
          pieza en el archivo local de la Raspberry Pi.
        </p>
      </div>

      {authStatus === "checking" ? (
        <p className={styles.status}>Comprobando sesion...</p>
      ) : null}

      {authStatus === "anonymous" ? (
        <form className={styles.form} onSubmit={handleLogin}>
          <label className={styles.field}>
            <span>Email de acceso</span>
            <input
              autoComplete="email"
              inputMode="email"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tu@email.test"
              required
              type="email"
              value={email}
            />
          </label>
          <button className={styles.primaryButton} disabled={isSubmitting} type="submit">
            Entrar y empezar
          </button>
        </form>
      ) : null}

      {authStatus === "authenticated" ? (
        <form className={styles.form} onSubmit={handleCapture}>
          <div className={styles.userBar}>
            <span>Sesion activa</span>
            <strong>{user?.email}</strong>
          </div>

          <label className={styles.field}>
            <span>Titulo</span>
            <input
              maxLength={120}
              name="titulo"
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Zocalo azul de portal modernista"
              required
              value={title}
            />
          </label>

          <label className={styles.field}>
            <span>Direccion exacta</span>
            <input
              autoComplete="street-address"
              name="direccion"
              onChange={(event) => {
                setAddressInput(event.target.value);
                setSelectedAddress(null);
                setSuggestions([]);
              }}
              placeholder="Calle, numero de portal, Valencia"
              required
              value={addressInput}
            />
          </label>

          {canSearchAddresses && suggestions.length > 0 ? (
            <div className={styles.suggestions} role="listbox">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => selectAddress(suggestion)}
                  type="button"
                >
                  {suggestion.label}
                </button>
              ))}
            </div>
          ) : null}

          {selectedAddress ? (
            <p className={styles.coordinates}>
              Coordenadas: {selectedAddress.latitude.toFixed(6)}, {" "}
              {selectedAddress.longitude.toFixed(6)}
            </p>
          ) : null}

          <label className={styles.fileDrop}>
            <span>Fotos</span>
            <strong>{files.length ? `${files.length}/3 seleccionadas` : "Hasta 3 imagenes"}</strong>
            <input
              accept="image/*"
              capture="environment"
              multiple
              name="fotos"
              onChange={(event) => handleFilesChange(event.target.files)}
              type="file"
            />
          </label>

          <button className={styles.primaryButton} disabled={isSubmitting} type="submit">
            Guardar publicacion
          </button>
        </form>
      ) : null}

      {message ? <p className={styles.status}>{message}</p> : null}
    </section>
  );
}

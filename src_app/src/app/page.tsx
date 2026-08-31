import { AppStateProvider } from "@/app-state/provider";
import { getRequestPreferences } from "@/app-state/server";
import { getCurrentUser } from "@/auth/current-user";

import { AppShell } from "./app-shell";
import styles from "./page.module.css";

export default async function Home() {
  const [initialPreferences, initialUser] = await Promise.all([
    getRequestPreferences(),
    getCurrentUser(),
  ]);

  return (
    <div className={styles.page}>
      <AppStateProvider
        initialPreferences={initialPreferences}
        initialUser={initialUser}
        key={initialUser?.id ?? "anonymous"}
      >
        <AppShell />
      </AppStateProvider>
    </div>
  );
}

import { CaptureForm } from "./capture-form";
import { Gallery } from "./gallery";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Taulellari</p>
          <h1>Azulejos de calle, archivados con coordenadas exactas.</h1>
          <p>
            Un cuaderno fotografico privado para conservar la ceramica popular
            que aparece en portales, zocalos y esquinas de Valencia.
          </p>
        </section>
        <CaptureForm />
        <Gallery />
      </main>
    </div>
  );
}

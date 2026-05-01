/**
 * Home Page — Interfaces Layer (Next.js page)
 *
 * A minimal landing page describing the project and its API.
 * No business logic lives here.
 */

import type { Metadata } from "next";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Multi-Currency Ledger — API",
};

const endpoints = [
  {
    method: "POST",
    path: "/api/accounts",
    description: "Create a new ledger account",
    body: `{
  "ownerId": "user-123",
  "name": "My EUR Wallet",
  "currencyCode": "EUR",
  "initialBalance": "1000.00",
  "allowOverdraft": false
}`,
  },
  {
    method: "GET",
    path: "/api/accounts?ownerId=user-123",
    description: "List all accounts for an owner",
    body: null,
  },
  {
    method: "GET",
    path: "/api/accounts/:accountId",
    description: "Get a single account by ID",
    body: null,
  },
  {
    method: "GET",
    path: "/api/accounts/:accountId/ledger",
    description: "List ledger entries (paginated)",
    body: null,
  },
  {
    method: "POST",
    path: "/api/transfers",
    description: "Initiate a transfer (same or cross-currency)",
    body: `{
  "sourceAccountId": "acc-abc",
  "destinationAccountId": "acc-xyz",
  "amount": "250.00",
  "description": "Monthly rent"
}`,
  },
  {
    method: "GET",
    path: "/api/transfers/:transferId",
    description: "Get a transfer by ID",
    body: null,
  },
];

export default function HomePage(): JSX.Element {
  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.badge}>Clean Architecture · Next.js · TypeScript</div>
        <h1 className={styles.title}>
          <span className={styles.accent}>Multi-Currency</span> Ledger
        </h1>
        <p className={styles.subtitle}>
          A production-ready REST API for managing ledger accounts and cross-currency transfers.
        </p>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>API Endpoints</h2>
        <div className={styles.endpointGrid}>
          {endpoints.map((ep) => (
            <div key={ep.path + ep.method} className={styles.endpointCard}>
              <div className={styles.endpointHeader}>
                <span className={`${styles.method} ${styles[`method${ep.method}`]}`}>
                  {ep.method}
                </span>
                <code className={styles.path}>{ep.path}</code>
              </div>
              <p className={styles.endpointDesc}>{ep.description}</p>
              {ep.body && <pre className={styles.codeBlock}>{ep.body}</pre>}
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Architecture Layers</h2>
        <div className={styles.layerGrid}>
          {[
            {
              layer: "Domain",
              path: "src/domain/",
              color: "#34d399",
              desc: "Entities, Value Objects, Repository Interfaces, Domain Services. Zero external dependencies.",
            },
            {
              layer: "Application",
              path: "src/application/",
              color: "#60a5fa",
              desc: "Use Cases, DTOs, Mappers, Port Interfaces. Orchestrates domain objects.",
            },
            {
              layer: "Infrastructure",
              path: "src/infrastructure/",
              color: "#fbbf24",
              desc: "Repository Implementations, Exchange Rate HTTP Client, UUID Generator, DI Container.",
            },
            {
              layer: "Interfaces",
              path: "src/interfaces/ + src/app/api/",
              color: "#f472b6",
              desc: "Next.js Route Handlers, Response helpers. Thin adapters over use cases.",
            },
          ].map(({ layer, path, color, desc }) => (
            <div key={layer} className={styles.layerCard} style={{ borderColor: color }}>
              <div className={styles.layerHeader}>
                <span className={styles.layerName} style={{ color }}>
                  {layer}
                </span>
                <code className={styles.layerPath}>{path}</code>
              </div>
              <p className={styles.layerDesc}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className={styles.footer}>
        <p>
          Dependency rule:{" "}
          <code>interfaces → application → domain ← infrastructure</code>
        </p>
      </footer>
    </main>
  );
}

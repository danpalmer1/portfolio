import { useEffect, useRef, useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

const ENDPOINT = "/api/contact"; // wired up in Phase 3 (SES Lambda + API Gateway)
const TURNSTILE_SITEKEY: string =
  (import.meta.env.PUBLIC_TURNSTILE_SITEKEY as string | undefined) ?? "";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        opts: {
          sitekey: string;
          callback?: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const widgetMountRef = useRef<HTMLDivElement>(null);

  // Render Turnstile (or surface a noticeable placeholder for local dev).
  useEffect(() => {
    if (!TURNSTILE_SITEKEY) return; // dev fallback path

    const renderWidget = () => {
      if (!window.turnstile || !widgetMountRef.current) return;
      widgetIdRef.current = window.turnstile.render(widgetMountRef.current, {
        sitekey: TURNSTILE_SITEKEY,
        theme: "dark",
        callback: (t) => setToken(t),
        "expired-callback": () => setToken(null),
        "error-callback": () => setToken(null),
      });
    };

    if (window.turnstile) {
      renderWidget();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.defer = true;
    script.addEventListener("load", renderWidget);
    document.head.appendChild(script);

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    // Honeypot — if the hidden "company" field is filled, silently succeed.
    if (formData.get("company")) {
      setStatus("success");
      return;
    }

    if (TURNSTILE_SITEKEY && !token) {
      setErrorMessage("Please complete the captcha first.");
      setStatus("error");
      return;
    }

    const payload = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      message: String(formData.get("message") ?? ""),
      turnstileToken: token,
    };

    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Server responded ${res.status}`);
      }
      setStatus("success");
    } catch (err) {
      // The endpoint isn't live yet (Phase 3), so this catches the fetch failure
      // and surfaces the error state. Once wired, the same path handles real errors.
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setErrorMessage(msg);
      setStatus("error");
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
        setToken(null);
      }
    }
  }

  if (status === "success") {
    return (
      <div
        className="rounded-lg border border-(--color-border) bg-(--color-surface)/60 p-8 text-center"
        role="status"
        aria-live="polite"
      >
        <p className="font-display text-2xl font-semibold tracking-[-0.03em] text-(--color-text)">
          Thanks — message received.
        </p>
        <p className="mt-3 text-(--color-text-muted)">
          I'll reply from <span className="text-(--color-text)">xdanielpalmerx@gmail.com</span> within a day or two.
        </p>
      </div>
    );
  }

  const disabled = status === "loading";

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5"
      noValidate
      aria-busy={status === "loading"}
    >
      {/* Honeypot — visually hidden, real bots love filling it in. */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px" }}>
        <label>
          Company
          <input type="text" name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div>
        <label htmlFor="name" className="block font-mono text-xs uppercase tracking-widest text-(--color-text-dim) mb-2">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          autoComplete="name"
          disabled={disabled}
          className="w-full rounded-md border border-(--color-border) bg-(--color-surface)/60 px-4 py-3 text-(--color-text) placeholder:text-(--color-text-dim) focus:border-(--color-accent-glow) focus:outline-none disabled:opacity-50"
          placeholder="Your name"
        />
      </div>

      <div>
        <label htmlFor="email" className="block font-mono text-xs uppercase tracking-widest text-(--color-text-dim) mb-2">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          disabled={disabled}
          className="w-full rounded-md border border-(--color-border) bg-(--color-surface)/60 px-4 py-3 text-(--color-text) placeholder:text-(--color-text-dim) focus:border-(--color-accent-glow) focus:outline-none disabled:opacity-50"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label htmlFor="message" className="block font-mono text-xs uppercase tracking-widest text-(--color-text-dim) mb-2">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          disabled={disabled}
          className="w-full rounded-md border border-(--color-border) bg-(--color-surface)/60 px-4 py-3 text-(--color-text) placeholder:text-(--color-text-dim) focus:border-(--color-accent-glow) focus:outline-none disabled:opacity-50 resize-y"
          placeholder="What's on your mind?"
        />
      </div>

      {TURNSTILE_SITEKEY ? (
        <div ref={widgetMountRef} className="min-h-[65px]" />
      ) : (
        <p className="rounded-md border border-dashed border-(--color-border) bg-(--color-surface)/40 px-4 py-3 text-xs font-mono uppercase tracking-widest text-(--color-text-dim)">
          Turnstile sitekey not configured — captcha will render once <code>PUBLIC_TURNSTILE_SITEKEY</code> is set.
        </p>
      )}

      {status === "error" && errorMessage && (
        <p className="rounded-md border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-200" role="alert">
          {errorMessage}
        </p>
      )}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={disabled}
          className="rounded-md bg-(--color-accent) px-5 py-2.5 text-sm font-medium text-(--color-bg) transition-all hover:-translate-y-0.5 hover:bg-(--color-accent-glow) disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {status === "loading" ? (
            <span className="inline-flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-(--color-bg)/40 border-t-(--color-bg)"
                aria-hidden="true"
              />
              Sending…
            </span>
          ) : (
            "Send message"
          )}
        </button>
        <p className="text-xs text-(--color-text-dim)">
          Replies go to the email you give me here — no inbox is shared.
        </p>
      </div>
    </form>
  );
}

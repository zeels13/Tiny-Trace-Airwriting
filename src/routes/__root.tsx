import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { type ReactNode } from "react";

import appCss from "../styles.css?url";
import { AppStateProvider } from "@/state/app-state";
import { LionMascot } from "@/components/animals/LionMascot";

function NotFoundComponent() {
  return (
    <div className="paper flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <LionMascot pose="thinking" className="mx-auto h-40 w-40" />
        <h1 className="mt-4 font-display text-4xl">This trail doesn't exist</h1>
        <p className="mt-2 text-text-soft">Let's head back to the jungle.</p>
        <div className="mt-6">
          <Link
            to="/home"
            className="inline-flex h-14 items-center justify-center rounded-2xl bg-forest px-8 font-display text-lg font-extrabold text-primary-foreground shadow-[0_5px_0_0_var(--tt-forest-deep)]"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="paper flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <LionMascot pose="try-again" className="mx-auto h-36 w-36" />
        <h1 className="mt-4 font-display text-3xl">Something got tangled up</h1>
        <p className="mt-2 text-text-soft">Let's try that again.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex h-14 items-center justify-center rounded-2xl bg-forest px-8 font-display text-lg font-extrabold text-primary-foreground shadow-[0_5px_0_0_var(--tt-forest-deep)]"
          >
            Try again
          </button>
          <a
            href="/home"
            className="inline-flex h-14 items-center justify-center rounded-2xl border-[3px] border-forest/25 bg-card px-8 font-display text-lg font-extrabold text-forest-deep"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Tiny Trace — Air-Writing Practice for Kids" },
      {
        name: "description",
        content:
          "Tiny Trace teaches children 4–7 to write strokes, shapes, numbers and letters by tracing in the air with their hand.",
      },
      {
        name: "keywords",
        content:
          "Tiny Trace, air writing, handwriting practice, kids learning, hand tracking, MediaPipe, gesture-based learning",
      },
      { name: "application-name", content: "Tiny Trace" },
      { name: "apple-mobile-web-app-title", content: "Tiny Trace" },
      { name: "theme-color", content: "#fcf6e9" },
      { property: "og:site_name", content: "Tiny Trace" },
      { property: "og:title", content: "Tiny Trace — Air-Writing Practice for Kids" },
      {
        property: "og:description",
        content: "A jungle journey that teaches writing through gesture-based air tracing.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Tiny Trace — Air-Writing Practice for Kids" },
      {
        name: "twitter:description",
        content: "A jungle journey that teaches writing through gesture-based air tracing.",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Nunito:wght@500;600;700;800&display=swap",
      },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "icon", href: "/favicon.png", type: "image/png", sizes: "256x256" },
      { rel: "apple-touch-icon", href: "/favicon.png" },
      { rel: "shortcut icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AppStateProvider>
        {/* Required: nested routes render here. */}
        <Outlet />
      </AppStateProvider>
    </QueryClientProvider>
  );
}

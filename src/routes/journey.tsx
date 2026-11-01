import { createFileRoute } from "@tanstack/react-router";

import { ChildTopBar } from "@/components/navigation/ChildTopBar";
import { JourneyMap } from "@/components/journey/JourneyMap";
import { LionMascot } from "@/components/animals/LionMascot";

export const Route = createFileRoute("/journey")({
  head: () => ({
    meta: [
      { title: "Journey Map — Tiny Trace" },
      {
        name: "description",
        content:
          "Follow the trail through Stroke Forest, Shape Valley, Number River, Alphabet Jungle and Word Safari.",
      },
      { property: "og:title", content: "Journey Map — Tiny Trace" },
      { property: "og:description", content: "Five worlds, one winding trail. See what's waiting next." },
    ],
  }),
  component: Journey,
});

function Journey() {
  return (
    <main className="paper min-h-screen pb-20">
      <ChildTopBar />
      <div className="mx-auto w-full max-w-3xl px-6 sm:px-10">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h1 className="font-display text-5xl leading-none">Your trail</h1>
            <p className="mt-3 max-w-md text-lg text-text-soft">
              Every world opens when you finish enough trails in the world before it.
            </p>
          </div>
          <LionMascot pose="pointing" className="hidden h-32 w-32 sm:block" />
        </div>

        <div className="mt-10">
          <JourneyMap />
        </div>
      </div>
    </main>
  );
}

"use client"; // REQUIRED: Tells Next.js this runs in the browser
import { trpc } from "@/lib/trpc";

export default function Home() {
  const { data, isLoading, error } = trpc.healthCheck.useQuery();

  if (isLoading) return <p>Connecting to Neon Database...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error.message}</p>;
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main style={{ padding: "2rem" }}>
        <h1>Bullseye FPL - Pipeline Test</h1>

        <div
          style={{
            marginTop: "2rem",
            padding: "1rem",
            border: "1px solid #ccc",
          }}
        >
          <h3>Database Connection Successful!</h3>
          <p>
            <strong>Neon DB Time:</strong> {data?.current_time}
          </p>
        </div>
      </main>
    </div>
  );
}

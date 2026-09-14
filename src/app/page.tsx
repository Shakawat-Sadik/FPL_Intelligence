"use client"; // REQUIRED: Tells Next.js this runs in the browser
import { trpc } from "@/lib/trpc";

export default function Home() {
  
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main style={{ padding: "2rem" }}>
        <h1>Assistant Manager</h1>

        <div
          style={{
            marginTop: "2rem",
            padding: "1rem",
            border: "1px solid #ccc",
          }}
        >
          <p>
            
          </p>
        </div>
      </main>
    </div>
  );
}

import TranscriptionApp from "@/src/components/TranscriptionApp";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="max-w-4xl mx-auto flex flex-col gap-8 items-center sm:items-start">
        <TranscriptionApp />
      </main>
    </div>
  );
}

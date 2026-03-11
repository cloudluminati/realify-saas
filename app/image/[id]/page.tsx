import { getSupabaseServer } from "@/app/lib/supabase-server";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ImagePage({ params }: any) {

  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from("image_generation_history")
    .select("image_url,prompt,created_at")
    .eq("id", params.id)
    .single();

  if (!data) {
    return notFound();
  }

  const encodedPrompt = encodeURIComponent(data.prompt || "");

  return (

    <main style={{ maxWidth: 900, margin: "auto", padding: 40 }}>

      <h1>Realify Creation</h1>

      <img
        src={data.image_url}
        style={{
          width: "100%",
          borderRadius: 12,
          marginTop: 20
        }}
      />

      {data.prompt && (

        <p style={{ marginTop: 20, fontSize: 16 }}>
          <strong>Prompt:</strong> {data.prompt}
        </p>

      )}

      <div style={{ marginTop: 30 }}>

        <a
          href={`/?prompt=${encodedPrompt}`}
          style={{
            padding: "10px 18px",
            background: "#111",
            color: "#fff",
            borderRadius: 6,
            textDecoration: "none",
            marginRight: 10
          }}
        >
          Generate This Image
        </a>

        <a
          href="/"
          style={{
            padding: "10px 18px",
            border: "1px solid #ccc",
            borderRadius: 6,
            textDecoration: "none"
          }}
        >
          Create Your Own
        </a>

      </div>

    </main>
  );
}

import { getSupabaseServer } from "@/app/lib/supabase-server";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ImagePage({ params }: any) {

  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from("image_generation_history")
    .select("id,image_url,prompt,created_at")
    .eq("id", params.id)
    .single();

  if (!data) {
    return notFound();
  }

  const encodedPrompt = encodeURIComponent(data.prompt || "");

  return (

    <main style={{ maxWidth: 900, margin: "auto", padding: 40 }}>

      <h1 style={{ fontSize: 36 }}>Realify Creation</h1>

      <p style={{ opacity: 0.6 }}>
        AI generated image created with Realify
      </p>

      <img
        src={data.image_url}
        style={{
          width: "100%",
          borderRadius: 12,
          marginTop: 30
        }}
      />

      {data.prompt && (

        <div
          style={{
            marginTop: 30,
            background: "#f7f7f7",
            padding: 16,
            borderRadius: 8
          }}
        >

          <p style={{ fontWeight: "bold", marginBottom: 6 }}>
            Prompt
          </p>

          <p style={{ fontSize: 15 }}>
            {data.prompt}
          </p>

        </div>

      )}

      <div style={{ marginTop: 30 }}>

        <a
          href={`/?prompt=${encodedPrompt}`}
          style={{
            padding: "12px 20px",
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
            padding: "12px 20px",
            border: "1px solid #ccc",
            borderRadius: 6,
            textDecoration: "none"
          }}
        >
          Create Your Own Images
        </a>

      </div>

    </main>
  );
}

import { getSupabaseServer } from "@/app/lib/supabase-server";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: any) {

  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from("image_generation_history")
    .select("image_url,prompt")
    .eq("id", params.id)
    .single();

  if (!data) {
    return {};
  }

  return {
    title: "Realify AI Creation",
    description: data.prompt || "AI generated image created with Realify",
    openGraph: {
      title: "Realify AI",
      description: data.prompt || "AI generated image created with Realify",
      images: [
        {
          url: data.image_url
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: "Realify AI",
      description: data.prompt || "AI generated image created with Realify",
      images: [data.image_url]
    }
  };

}

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

  const tweetText = encodeURIComponent(
    `I created this AI image with Realify\n\n${process.env.NEXT_PUBLIC_SITE_URL || ""}/image/${data.id}`
  );

  const tweetUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;

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
            textDecoration: "none",
            marginRight: 10
          }}
        >
          Create Your Own Images
        </a>

        <a
          href={tweetUrl}
          target="_blank"
          style={{
            padding: "12px 20px",
            background: "#1DA1F2",
            color: "#fff",
            borderRadius: 6,
            textDecoration: "none"
          }}
        >
          Share on X
        </a>

      </div>

    </main>
  );
}

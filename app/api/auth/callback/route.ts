import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  const response = NextResponse.redirect(new URL("/", request.url));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.headers.get("cookie")
            ? request.headers.get("cookie")!.split("; ").map((c) => {
                const [name, ...rest] = c.split("=");
                return { name, value: rest.join("=") };
              })
            : [];
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  if (code) {
    console.log("CODE FOUND:", code);
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    console.log("EXCHANGE RESULT:", data, error);
  }

  return response;
}

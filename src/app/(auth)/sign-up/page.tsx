import AuthForm from "@/components/AuthForm";
import { signUp } from "@/lib/auth/actions";

interface SignUpPageProps {
  searchParams: Promise<{ redirect?: string | string[] }>;
}

export default async function Page({ searchParams }: SignUpPageProps) {
  const params = await searchParams;
  const redirectTo = typeof params.redirect === "string" ? params.redirect : undefined;

  return <AuthForm mode="sign-up" onSubmit={signUp} redirectTo={redirectTo} />;
}

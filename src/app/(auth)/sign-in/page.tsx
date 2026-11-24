import AuthForm from "@/components/AuthForm";
import { signIn } from "@/lib/auth/actions";

interface SignInPageProps {
  searchParams: Promise<{ redirect?: string | string[] }>;
}

export default async function Page({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const redirectTo = typeof params.redirect === "string" ? params.redirect : undefined;

  return <AuthForm mode="sign-in" onSubmit={signIn} redirectTo={redirectTo} />;
}

import { redirect } from "next/navigation";

export default function SignupPage() {
  redirect("/login?message=Public%20signup%20disabled.%20Ask%20an%20admin%20to%20invite%20you.");
}

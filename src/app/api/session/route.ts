import { jsonOk } from "@/lib/api";
import { getCurrentUser } from "@/lib/security";

export async function GET() {
  const user = await getCurrentUser();
  return jsonOk({ user });
}

import { DocumentWorkspace } from "@/components/document-workspace";
import { authenticationState } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const authentication = authenticationState();
  return (
    <DocumentWorkspace
      authUsername={
        authentication.mode === "configured"
          ? authentication.configuration.username
          : undefined
      }
    />
  );
}

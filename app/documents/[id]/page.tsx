import { DocumentWorkspace } from "@/components/document-workspace";
import { authenticationState } from "@/lib/auth";
import { notFound } from "next/navigation";

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const documentId = Number(id);
  if (!Number.isSafeInteger(documentId) || documentId <= 0) notFound();

  const authentication = authenticationState();
  return (
    <DocumentWorkspace
      initialDocumentId={documentId}
      authUsername={
        authentication.mode === "configured"
          ? authentication.configuration.username
          : undefined
      }
    />
  );
}

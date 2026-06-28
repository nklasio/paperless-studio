import { DocumentWorkspace } from "@/components/document-workspace";
import { notFound } from "next/navigation";

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const documentId = Number(id);
  if (!Number.isSafeInteger(documentId) || documentId <= 0) notFound();

  return <DocumentWorkspace initialDocumentId={documentId} />;
}

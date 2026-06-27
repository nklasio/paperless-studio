import { DocumentWorkspace } from "@/components/document-workspace";

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DocumentWorkspace initialDocumentId={Number(id)} />;
}
